import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
// Silence internal SDK warnings (e.g. Could not reach backend) in console
setLogLevel('silent');

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); 
export const auth = getAuth();

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection successful.");
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase connection test: Operating in offline mode. Please check your Firebase configuration or internet connection.");
    }
  }
}

testConnection();
