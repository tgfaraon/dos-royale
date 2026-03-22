import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DB_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const firestore = getFirestore(app);
export const auth = getAuth(app);

// Create a promise that resolves when auth is ready
export const authReady = new Promise((resolve) => {
    // If already signed in (rare but possible), resolve immediately
    if (auth.currentUser) {
        console.log("[AUTH] Already signed in:", auth.currentUser.uid);
        resolve(true);
        return;
    }

    // Otherwise wait for the first auth state
    const unsub = onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("[AUTH] Ready:", user.uid);
            resolve(true);
            unsub(); // stop listening
        }
    });
});

// Start sign-in
signInAnonymously(auth).catch(err => {
    console.error("[AUTH ERROR]", err);
});