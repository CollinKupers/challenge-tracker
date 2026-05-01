import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBR--PADrsgSs8BNghEe9xq9gsl_B9fTJw",
  authDomain: "the-challenge-tracker.firebaseapp.com",
  databaseURL: "https://the-challenge-tracker-default-rtdb.firebaseio.com",
  projectId: "the-challenge-tracker",
  storageBucket: "the-challenge-tracker.firebasestorage.app",
  messagingSenderId: "427423000133",
  appId: "1:427423000133:web:edeca6ee3c1140fcd8252c"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

export async function dbGet(path) {
  try {
    const snap = await get(ref(db, path));
    return snap.exists() ? snap.val() : null;
  } catch { return null; }
}

export async function dbSet(path, value) {
  try { await set(ref(db, path), value); } catch {}
}

export function dbListen(path, cb) {
  return onValue(ref(db, path), snap => cb(snap.exists() ? snap.val() : null));
}
