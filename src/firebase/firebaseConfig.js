// src/firebase/firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getFirestore, serverTimestamp } from "firebase/firestore";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCblSjCK6nrL2uYK89c3GSLq2gNdfaGUpg",
  authDomain: "st-uriel-youth-portal.firebaseapp.com",
  projectId: "st-uriel-youth-portal",
  storageBucket: "st-uriel-youth-portal.appspot.com", // 🔹 ADD THIS
  messagingSenderId: "31098781825",
  appId: "1:31098781825:web:90772139016b4f0122cd80",
  measurementId: "G-B315BV2XCW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);

// Optional constants
export const APP_ID = "st-uriel-portal"; 
export const INITIAL_AUTH_TOKEN = ""; 

// Exports
export { 
  app,
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
  serverTimestamp
};
