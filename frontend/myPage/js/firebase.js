// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getMessaging } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDBe-9_CZgjp6E0vQYQio6EktLBeACLeKw",
  authDomain: "doctorappointmentapp-de8d8.firebaseapp.com",
  projectId: "doctorappointmentapp-de8d8",
  storageBucket: "doctorappointmentapp-de8d8.firebasestorage.app",
  messagingSenderId: "415433775181",
  appId: "1:415433775181:web:ac1645ea6bdb05088ae404",
  measurementId: "G-0LQPPCEVYE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);
console.log("Firebase initialized");
