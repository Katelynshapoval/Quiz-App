// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "quiz-app-d2c9d.firebaseapp.com",
  projectId: "quiz-app-d2c9d",
  storageBucket: "quiz-app-d2c9d.firebasestorage.app",
  messagingSenderId: "240780010378",
  appId: "1:240780010378:web:cb19727fd1989fcf0dde73",
  measurementId: "G-4MH62KGJT3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app); // Firestore instance

export { db };
