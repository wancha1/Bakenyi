/**
 * Audio Utilities: Validation, Formatting, and Client-Side Audio Compression.
 * Optimized for oral history recordings, native Lukenye voice archives, and community audio uploads.
 */

export interface AudioValidationOptions {
  /** Maximum allowed audio size in bytes. Default: 25 MB (25 * 1024 * 1024) */
  maxSizeBytes?: number;
  /** Whether to attempt client-side audio compression if supported. Default: true */
  enableCompression?: boolean;
  /** Target sample rate for compressed audio (Hz). Default: 22050 Hz (ideal for speech) */
  targetSampleRate?: number;
  /** Target audio encoding bitrate in kbps. Default: 64 kbps */
  targetBitrateKbps?: number;
}

export interface CompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  isCompressed: boolean;
  error: Error | null;
}

/**
 * Format bytes into human-readable string (e.g., "12.5 MB", "450 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Validates audio file size and performs optional client-side audio downsampling / compression.
 * Uses Web Audio API (AudioContext/OfflineAudioContext) to resample voice recordings down to
 * 22.05 kHz mono at ~64kbps, significantly reducing upload bandwidth without losing speech clarity.
 */
export async function validateAndCompressAudio(
  audioBlob: Blob,
  options: AudioValidationOptions = {}
): Promise<CompressionResult> {
  const maxSizeBytes = options.maxSizeBytes ?? 25 * 1024 * 1024; // 25MB default
  const enableCompression = options.enableCompression ?? true;
  const targetSampleRate = options.targetSampleRate ?? 22050;
  const targetBitrate = (options.targetBitrateKbps ?? 64) * 1000;

  const originalSize = audioBlob.size;

  // Initial sanity check
  if (!audioBlob || originalSize === 0) {
    return {
      blob: audioBlob,
      originalSize: 0,
      compressedSize: 0,
      isCompressed: false,
      error: new Error('Selected audio file is empty or invalid.')
    };
  }

  let finalBlob = audioBlob;
  let isCompressed = false;

  // Attempt client-side compression if enabled and AudioContext is available
  if (enableCompression && typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
    try {
      const compressed = await compressAudioBlob(audioBlob, targetSampleRate, targetBitrate);
      if (compressed && compressed.size < originalSize) {
        finalBlob = compressed;
        isCompressed = true;
        console.log(
          `[AudioCompressor] Audio compressed from ${formatFileSize(originalSize)} down to ${formatFileSize(finalBlob.size)} (${Math.round((1 - finalBlob.size / originalSize) * 100)}% reduction).`
        );
      }
    } catch (compressErr) {
      console.warn('[AudioCompressor] Client-side audio compression skipped/failed, using original blob:', compressErr);
    }
  }

  const finalSize = finalBlob.size;

  // Max file size validation
  if (finalSize > maxSizeBytes) {
    const errorMsg = `Audio recording (${formatFileSize(finalSize)}) exceeds the maximum allowed upload limit of ${formatFileSize(maxSizeBytes)}. Please select or record a shorter audio file.`;
    return {
      blob: finalBlob,
      originalSize,
      compressedSize: finalSize,
      isCompressed,
      error: new Error(errorMsg)
    };
  }

  return {
    blob: finalBlob,
    originalSize,
    compressedSize: finalSize,
    isCompressed,
    error: null
  };
}

/**
 * Internal helper to decode, resample to mono, and re-encode audio using OfflineAudioContext & MediaRecorder.
 */
async function compressAudioBlob(
  inputBlob: Blob,
  targetSampleRate: number,
  targetBitrate: number
): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    const arrayBufferPromise = inputBlob.arrayBuffer();
    arrayBufferPromise
      .then(async (arrayBuffer) => {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        const tempCtx = new AudioCtxClass();

        let audioBuffer: AudioBuffer;
        try {
          audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
        } catch (e) {
          tempCtx.close().catch(() => {});
          return resolve(null); // Return null to fallback to original
        } finally {
          tempCtx.close().catch(() => {});
        }

        // If audio is already small (e.g. < 500KB) and low sample rate, no need to compress further
        if (inputBlob.size < 500 * 1024 && audioBuffer.sampleRate <= targetSampleRate) {
          return resolve(null);
        }

        const numberOfChannels = 1; // Downsample to Mono for speech clarity and compact size
        const duration = audioBuffer.duration;
        const renderSampleRate = Math.min(audioBuffer.sampleRate, targetSampleRate);

        const offlineCtx = new OfflineAudioContext(
          numberOfChannels,
          Math.ceil(duration * renderSampleRate),
          renderSampleRate
        );

        // Create buffer source
        const source = offlineCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineCtx.destination);
        source.start(0);

        const renderedBuffer = await offlineCtx.startRendering();

        // Convert rendered audio buffer to Blob using MediaStream / MediaRecorder or WAV fallback
        if (typeof MediaRecorder !== 'undefined' && MediaStream) {
          try {
            const streamDestination = new AudioContext({ sampleRate: renderSampleRate }).createMediaStreamDestination();
            const bufferSource = streamDestination.context.createBufferSource();
            bufferSource.buffer = renderedBuffer;
            bufferSource.connect(streamDestination);

            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
              ? 'audio/webm;codecs=opus'
              : MediaRecorder.isTypeSupported('audio/webm')
              ? 'audio/webm'
              : MediaRecorder.isTypeSupported('audio/ogg')
              ? 'audio/ogg'
              : '';

            if (mimeType) {
              const mediaRecorder = new MediaRecorder(streamDestination.stream, {
                mimeType,
                audioBitsPerSecond: targetBitrate
              });

              const chunks: Blob[] = [];
              mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) chunks.push(e.data);
              };

              mediaRecorder.onstop = () => {
                const compressedBlob = new Blob(chunks, { type: mimeType });
                (streamDestination.context as AudioContext).close?.().catch(() => {});
                resolve(compressedBlob);
              };

              mediaRecorder.start();
              bufferSource.start(0);

              // Stop recording after duration + slight buffer
              setTimeout(() => {
                try {
                  if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
                } catch (e) {
                  resolve(encodeWavBuffer(renderedBuffer));
                }
              }, Math.ceil(duration * 1000) + 100);

              return;
            }
          } catch (recErr) {
            console.warn('[AudioCompressor] MediaRecorder re-encode failed, falling back to WAV encoder:', recErr);
          }
        }

        // Fallback: encode resampled audio buffer directly to WAV
        const wavBlob = encodeWavBuffer(renderedBuffer);
        resolve(wavBlob);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * Encodes an AudioBuffer into a WAV Blob
 */
function encodeWavBuffer(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result: Float32Array;
  if (numChannels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    result = new Float32Array(left.length + right.length);
    for (let i = 0; i < left.length; i++) {
      result[i * 2] = left[i];
      result[i * 2 + 1] = right[i];
    }
  } else {
    result = buffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = result.length * bytesPerSample;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + dataSize, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw PCM) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true);
  /* block align */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, dataSize, true);

  // Float32 to Int16 PCM
  let offset = 44;
  for (let i = 0; i < result.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
