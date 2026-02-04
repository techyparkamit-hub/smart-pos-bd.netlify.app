import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Handle global variables expected from the source environment
declare global {
  interface Window {
    __firebase_config?: string;
    __app_id?: string;
    __initial_auth_token?: string;
  }
}

const firebaseConfigStr = typeof window !== 'undefined' ? (window.__firebase_config || '{}') : '{}';
const firebaseConfig = JSON.parse(firebaseConfigStr);

// Fallback for development if no config is injected (prevents crash, but features wont work)
const finalConfig = Object.keys(firebaseConfig).length > 0 ? firebaseConfig : {
  apiKey: "dummy",
  authDomain: "dummy.firebaseapp.com",
  projectId: "dummy",
  storageBucket: "dummy.appspot.com",
  messagingSenderId: "000000000",
  appId: "1:000000000:web:000000000"
};

const app = initializeApp(finalConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';
