// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, initializeAuth } from "firebase/auth";
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
const auth = getAuth(app)
const db = getFirestore(app);
export {auth,db}