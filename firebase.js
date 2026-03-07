import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAnA3qN9vAcZpyyWLtm1fCmwUj0vz4h1wI",
  authDomain: "budget-app-48210.firebaseapp.com",
  projectId: "budget-app-48210",
  storageBucket: "budget-app-48210.firebasestorage.app",
  messagingSenderId: "892980549099",
  appId: "1:892980549099:web:be62f107b80da3fa6d35ae",
  measurementId: "G-JGV0FDM5PH"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);