import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAh0pLMclBO9Pr39EFbgFmYC14qSNaRqi8",
  authDomain: "taro-app-42eb3.firebaseapp.com",
  projectId: "taro-app-42eb3",
  storageBucket: "taro-app-42eb3.appspot.com",
  messagingSenderId: "110850745746",
  appId: "1:110850745746:web:4396bd3e166e86c898d4b"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);