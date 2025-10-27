import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDajc4URsD0ACuBWcMVYDpQt0PhM3VebwE",
  authDomain: "karaokeroom-dashboard.firebaseapp.com",
  databaseURL: "https://karaokeroom-dashboard-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "karaokeroom-dashboard",
  storageBucket: "karaokeroom-dashboard.firebasestorage.app",
  messagingSenderId: "744255253265",
  appId: "1:744255253265:web:f26619f72edc5e8ffb3ab0",
  measurementId: "G-HMTFSDEWX8"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);