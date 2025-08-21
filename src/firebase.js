// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC2RM2HldOB3ScxGRpGxkSj9wvuDqAwWm4",
  authDomain: "academic-progress-tracke-4774a.firebaseapp.com",
  projectId: "academic-progress-tracke-4774a",
  storageBucket: "academic-progress-tracke-4774a.firebasestorage.app",
  messagingSenderId: "660250554925",
  appId: "1:660250554925:web:55db1dfd08215d6e493ea4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);