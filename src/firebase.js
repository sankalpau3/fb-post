// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
apiKey: "AIzaSyBPDYL0P6hFpxv-QDzXsytr5M4cIO3le7k",
authDomain: "rtcc-app.firebaseapp.com",
projectId: "rtcc-app",
storageBucket: "rtcc-app.firebasestorage.app",
messagingSenderId: "229592823958",
appId: "1:229592823958:web:9c05aa2718e30c7f45eab7",
measurementId: "G-6LG48F3S2T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);