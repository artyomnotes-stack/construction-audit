
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDzGqLYHa-3DEpwgAj0IF7dX5I-aGvrlsU",
  authDomain: "engineer-tools-saas.firebaseapp.com",
  projectId: "engineer-tools-saas",
  storageBucket: "engineer-tools-saas.firebasestorage.app",
  messagingSenderId: "465695776178",
  appId: "1:465695776178:web:ebb1984f7db01c810618ab",
  measurementId: "G-MSCQ65J58K"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
