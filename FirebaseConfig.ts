// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeAuth } from "firebase/auth";
import { getReactNativePersistence } from 'firebase/auth/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Auth with React Native persistence so the user stays signed in across restarts
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

export { auth, db };