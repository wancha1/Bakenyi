import { 
  authService, 
  userService, 
  galleryService, 
  contributionService 
} from '../services/appwriteServices';
import { client, DATABASE_ID } from '../appwrite/config';

// Mock DB and Auth exports for compatibility
export const db = { type: 'firestore' };

export const auth = {
  get currentUser() {
    return null;
  },
  async signOut() {
    return await authService.logout();
  }
};

export class GoogleAuthProvider {
  setCustomParameters(params?: any) {}
}

export function collection(dbInstance: any, name: string) {
  return { type: 'collection', name };
}

export function query(coll: any, ...args: any[]) {
  return { type: 'query', collection: coll.name, criteria: args };
}

export function where(field: string, op: string, value: any) {
  return { type: 'where', field, op, value };
}

export function orderBy(field: string, direction = 'asc') {
  return { type: 'orderBy', field, direction };
}

export function serverTimestamp() {
  return new Date().toISOString();
}

export class Timestamp {
  seconds: number;
  nanoseconds: number;
  constructor(seconds: number, nanoseconds: number) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }
  toDate() {
    return new Date(this.seconds * 1000);
  }
}

// Simulated real-time subscriber mapping directly to Appwrite Realtime
export function onSnapshot(
  qObj: any, 
  onNext: (snapshot: any) => void, 
  onError?: (err: any) => void
) {
  const collectionName = qObj.collection || qObj.name;
  let active = true;

  const fetchData = async () => {
    try {
      let docs: any[] = [];
      if (collectionName === 'gallery') {
        const albums = await galleryService.getGalleryAlbums();
        // Map album data or images to individual image entries expected by Gallery.tsx
        const tempDocs: any[] = [];
        albums.forEach(album => {
          if (album.images && album.images.length > 0) {
            album.images.forEach((img, idx) => {
              tempDocs.push({
                id: `${album.id}_${idx}`,
                imageUrl: img.url,
                title: album.title,
                category: 'Tradition',
                description: img.caption || album.description || ''
              });
            });
          } else {
            tempDocs.push({
              id: album.id,
              imageUrl: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&q=80&w=800',
              title: album.title,
              category: 'Tradition',
              description: album.description || ''
            });
          }
        });
        docs = tempDocs;
      } else if (collectionName === 'contributions') {
        const userIdWhere = qObj.criteria?.find((c: any) => c.type === 'where' && c.field === 'userId');
        const userId = userIdWhere ? userIdWhere.value : undefined;
        const contribs = await contributionService.getContributions(userId);
        docs = contribs.map(c => ({
          id: c.id,
          userId: c.userId,
          userEmail: c.userEmail,
          title: c.title,
          description: c.description,
          type: c.type,
          status: c.status,
          submittedAt: c.submittedAt,
          imageUrl: c.imageUrl
        }));
      }

      if (active) {
        onNext({
          docs: docs.map(d => ({
            id: d.id,
            data: () => d
          }))
        });
      }
    } catch (err) {
      if (active && onError) onError(err);
    }
  };

  fetchData();

  // Appwrite Realtime listener
  const channel = `databases.${DATABASE_ID}.collections.*.documents`;
  const unsubscribe = client.subscribe(channel, () => {
    fetchData();
  });

  return () => {
    active = false;
    unsubscribe();
  };
}

export async function addDoc(collObj: any, data: any) {
  const collectionName = collObj.name;
  if (collectionName === 'contributions') {
    const docId = await contributionService.createContribution({
      userId: data.userId,
      userEmail: data.userEmail,
      title: data.title,
      description: data.description,
      type: data.type,
      status: data.status,
      imageUrl: data.imageUrl
    });
    return { id: docId };
  }
  throw new Error(`addDoc mock not implemented for collection: ${collectionName}`);
}

// Authentication flow
export function onAuthStateChanged(authInstance: any, callback: (user: any) => void) {
  let active = true;
  const checkSession = async () => {
    try {
      const u = await authService.getCurrentUser();
      if (active) {
        callback(u);
      }
    } catch (err) {
      if (active) {
        callback(null);
      }
    }
  };
  checkSession();
  return () => {
    active = false;
  };
}

export async function signInWithEmailAndPassword(authInstance: any, email: string, password: string) {
  await authService.login(email, password);
  const u = await authService.getCurrentUser();
  if (!u) throw new Error("Failed to sign in. User session could not be established.");
  return { user: u };
}

export async function createUserWithEmailAndPassword(authInstance: any, email: string, password: string) {
  await authService.register(email, password, email.split('@')[0]);
  const u = await authService.getCurrentUser();
  if (!u) throw new Error("Failed to register. User session could not be established.");
  return { user: u };
}

export async function signInWithPopup(authInstance: any, provider: any) {
  return await authService.loginWithGoogle();
}

export async function signOut(authInstance: any) {
  return await authService.logout();
}
