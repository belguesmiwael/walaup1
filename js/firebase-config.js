/* ════════════════════════════════════════════════════════
   HIVEAPP — firebase-config.js
   Initialisation Firebase — à charger EN PREMIER sur toutes les pages
   Dépend de : firebase-app-compat.js + firebase-firestore-compat.js
════════════════════════════════════════════════════════ */

const FC = {
  apiKey:            "AIzaSyC3bwhZRIksakjHjmJ1j_baBJjFV3GLG7k",
  authDomain:        "bizflow-5b1e2.firebaseapp.com",
  projectId:         "bizflow-5b1e2",
  storageBucket:     "bizflow-5b1e2.firebasestorage.app",
  messagingSenderId: "788764741062",
  appId:             "1:788764741062:web:0353d4bac230a3e22b36c7"
};

firebase.initializeApp(FC);

// Globales accessibles depuis tous les scripts suivants
const db = firebase.firestore();
const FS = firebase.firestore.FieldValue;
