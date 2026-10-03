import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAMn94eScO9K9Jl5I6EFDouJypBTKLTKMs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ghostpost-3cb7c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ghostpost-3cb7c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ghostpost-3cb7c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "556844477733",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:556844477733:web:1597998085e088e699fecc",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
