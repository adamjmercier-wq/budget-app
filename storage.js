import { db, auth } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Get the current user's ID
export function getUserId() {
  return auth.currentUser?.uid;
}

// Load data from the internet (Firebase)
export async function load(key, fallback) {
  try {
    const userId = getUserId();
    if (!userId) return fallback;

    const docRef = doc(db, "users", userId, "data", key);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().value;
    }
    return fallback;
  } catch (e) {
    console.error("Load failed:", e);
    return fallback;
  }
}

// Save data to the internet (Firebase)
export async function save(key, value) {
  try {
    const userId = getUserId();
    if (!userId) return;

    const docRef = doc(db, "users", userId, "data", key);
    await setDoc(docRef, { value, updatedAt: new Date() }, { merge: true });
  } catch (e) {
    console.error("Save failed:", e);
  }
}