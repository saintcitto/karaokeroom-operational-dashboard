// src/firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, set, onValue, remove, update, push } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDajc4URsD0ACuBWcMVYDpQt0PhM3VebwE",
  authDomain: "karaokeroom-dashboard.firebaseapp.com",
  databaseURL: "https://karaokeroom-dashboard-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "karaokeroom-dashboard",
  storageBucket: "karaokeroom-dashboard.appspot.com",
  messagingSenderId: "744255253265",
  appId: "1:744255253265:web:f26619f72edc5e8ffb3ab0",
  measurementId: "G-HMTFSDEWX8"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let db, auth;

try {
  db = getDatabase(app);
  auth = getAuth(app);
  console.log("🔥 Firebase initialized successfully!");
} catch (err) {
  console.error("❌ Firebase initialization failed:", err);
}

export { db, auth, ref, set, onValue, remove, update, push };
