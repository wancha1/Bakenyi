export interface Frontmatter {
  title?: string;
  author?: string;
  category?: string;
  featured_image?: string;
  thumbnail_image?: string;
  youtube_url?: string;
  summary?: string;
  description?: string;
  date?: string;
  publish_date?: string;
  tags?: string[] | string;
  images?: Array<{ image: string; caption?: string }>;
  draft?: boolean;
}

export interface ParsedContent<T = Frontmatter> {
  slug: string;
  frontmatter: T;
  content: string;
}

/**
 * Custom YAML and Frontmatter Parser
 * Safely parses markdown files with YAML frontmatter in front-end browser environments.
 */
export function parseMarkdown<T = Frontmatter>(filePath: string, fileContent: string): ParsedContent<T> {
  const slug = filePath.split('/').pop()?.replace(/\.md$/, '') || '';
  
  if (!fileContent.startsWith('---')) {
    return {
      slug,
      frontmatter: {} as T,
      content: fileContent.trim()
    };
  }
  
  const parts = fileContent.split('---');
  if (parts.length < 3) {
    return {
      slug,
      frontmatter: {} as T,
      content: fileContent.trim()
    };
  }
  
  const yamlContent = parts[1];
  const content = parts.slice(2).join('---').trim();
  const frontmatter = parseYaml(yamlContent);
  
  return {
    slug,
    frontmatter: frontmatter as T,
    content
  };
}

export function parseYaml(yamlStr: string): any {
  const result: any = {};
  const lines = yamlStr.split('\n');
  
  let currentKey = '';
  let listObj: any = null;
  let inList = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    // Detect indent
    const indent = line.search(/\S/);
    
    if (trimmed.startsWith('-')) {
      inList = true;
      const content = trimmed.replace(/^-\s*/, '');
      if (content.includes(':')) {
        // Key-value inside a list object (e.g. - image: "/uploads/img.jpg")
        const colonIdx = content.indexOf(':');
        const k = content.slice(0, colonIdx).trim();
        const v = content.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, '');
        
        listObj = { [k]: v };
        if (!Array.isArray(result[currentKey])) {
          result[currentKey] = [];
        }
        result[currentKey].push(listObj);
      } else {
        // Simple scalar inside list (e.g. - "tag1")
        const val = content.replace(/^['"]|['"]$/g, '');
        if (!Array.isArray(result[currentKey])) {
          result[currentKey] = [];
        }
        result[currentKey].push(val);
      }
    } else if (trimmed.includes(':')) {
      const colonIdx = trimmed.indexOf(':');
      const k = trimmed.slice(0, colonIdx).trim();
      const v = trimmed.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      
      if (indent > 0 && listObj && inList) {
        // Key-value in the current list object (e.g. caption: "My caption" under - image:)
        listObj[k] = v;
      } else {
        // Root level key-value or starting a structure
        currentKey = k;
        listObj = null;
        inList = false;
        if (v === '') {
          result[k] = null;
        } else {
          if (v.toLowerCase() === 'true') {
            result[k] = true;
          } else if (v.toLowerCase() === 'false') {
            result[k] = false;
          } else if (!isNaN(Number(v)) && v !== '') {
            result[k] = Number(v);
          } else {
            result[k] = v;
          }
        }
      }
    }
  }
  return result;
}

// Global loaders for each collection
export function loadNews(): ParsedContent[] {
  try {
    const files = (import.meta as any).glob('/content/news/*.md', { query: '?raw', eager: true }) as Record<string, { default: string }>;
    return Object.entries(files).map(([filePath, module]) => parseMarkdown(filePath, module.default));
  } catch (e) {
    console.warn('No news files found or failed to parse', e);
    return [];
  }
}

export function loadBlogs(): ParsedContent[] {
  try {
    const files = (import.meta as any).glob('/content/blogs/*.md', { query: '?raw', eager: true }) as Record<string, { default: string }>;
    return Object.entries(files).map(([filePath, module]) => parseMarkdown(filePath, module.default));
  } catch (e) {
    console.warn('No blog files found or failed to parse', e);
    return [];
  }
}

export function loadVlogs(): ParsedContent[] {
  try {
    const files = (import.meta as any).glob('/content/vlogs/*.md', { query: '?raw', eager: true }) as Record<string, { default: string }>;
    return Object.entries(files).map(([filePath, module]) => parseMarkdown(filePath, module.default));
  } catch (e) {
    console.warn('No vlog files found or failed to parse', e);
    return [];
  }
}

export function loadGallery(): ParsedContent[] {
  try {
    const files = (import.meta as any).glob('/content/gallery/*.md', { query: '?raw', eager: true }) as Record<string, { default: string }>;
    return Object.entries(files).map(([filePath, module]) => parseMarkdown(filePath, module.default));
  } catch (e) {
    console.warn('No gallery files found or failed to parse', e);
    return [];
  }
}
