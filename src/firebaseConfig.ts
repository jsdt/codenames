// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
//import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCk_A0qO3359wXPlEQx7lWjlGjy9XhpBHc",
  authDomain: "codenames-hackweek.firebaseapp.com",
  databaseURL: "https://codenames-hackweek-default-rtdb.firebaseio.com",
  projectId: "codenames-hackweek",
  storageBucket: "codenames-hackweek.appspot.com",
  messagingSenderId: "325628516663",
  appId: "1:325628516663:web:458a83f8ce2cdbf7d922b2",
  measurementId: "G-F7NE7FKKSN"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);