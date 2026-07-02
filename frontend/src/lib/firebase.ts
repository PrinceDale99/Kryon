import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAnoGn7HDQTbEIF9LCURQNwl8B0WMt4Gk0",
  authDomain: "kryonnetwork.firebaseapp.com",
  projectId: "kryonnetwork",
  storageBucket: "kryonnetwork.firebasestorage.app",
  messagingSenderId: "934847835615",
  appId: "1:934847835615:web:42d0fa29ef00953153e86a",
  measurementId: "G-P39VZLNNED"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
