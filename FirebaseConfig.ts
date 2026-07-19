// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeAuth } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

// Workaround for Firebase v10.x TypeScript declaration bug
// @ts-ignore
import { getReactNativePersistence } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAvrssPPAaNfFFzxWLRKC5yrQ2ZO6fk-ps",
  authDomain: "fndparking.firebaseapp.com",
  projectId: "fndparking",
  storageBucket: "fndparking.firebasestorage.app",
  messagingSenderId: "899526952543",
  appId: "1:899526952543:web:b2559c547e120e6c03fdea",
  measurementId: "G-BVZ93XWR9M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with React Native persistence
// @ts-ignore
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

export { auth, db };