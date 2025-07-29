import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC6hhzFrjSX-TG9K1gJ6xkWOAFaQmAO0uM",
  authDomain: "focustrack-3bc61.firebaseapp.com",
  projectId: "focustrack-3bc61",
  storageBucket: "focustrack-3bc61.appspot.com",
  messagingSenderId: "334560997717",
  appId: "1:334560997717:web:4ac65bd2013059b1617fdc",
  measurementId: "G-0SERLF2WGL",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
