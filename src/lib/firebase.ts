import { getApps, initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyALUtV-BEvJt8Cgc5EIDrAenVnOOZZWOmg",
  authDomain: "dual-id-attendance-system.firebaseapp.com",
  databaseURL:
    "https://dual-id-attendance-system-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dual-id-attendance-system",
  storageBucket: "dual-id-attendance-system.firebasestorage.app",
  messagingSenderId: "329190856045",
  appId: "1:329190856045:web:dd05f820b2bf1a803ef664"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const database = getDatabase(app);
