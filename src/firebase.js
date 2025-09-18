// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
// saving user
export async function saveUser(uid, email, role, orgId) {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      uid,
      email,
      role,       // "admin" or "officer"
      orgId,
      createdAt: serverTimestamp(),
    });
  }
// 🔥 Replace with your Firebase config from Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyBBH68zTD28IBfURjsfQpWxKczvhkzrqHM",
    authDomain: "docsphere-ai.firebaseapp.com",
    projectId: "docsphere-ai",
    storageBucket: "docsphere-ai.firebasestorage.app", // ⚠️ double-check this (usually ends with .appspot.com)
    messagingSenderId: "52501993967",
    appId: "1:52501993967:web:91b3378d2daf50907d3e1a",
    measurementId: "G-JXZK5ERX7W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export core services
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * ✅ Register user with email + password
 * - Sets display name (if provided)
 * - Sends verification email
 */
export async function registerUser(email, password, displayName) {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);

  if (displayName) {
    await updateProfile(userCred.user, { displayName });
  }

  // Send verification email
  await sendEmailVerification(userCred.user);

  return userCred;
}

/**
 * ✅ Login user with email + password
 */
export async function loginUser(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}

/**
 * ✅ Save organization metadata in Firestore
 * - Stores org, admin, and officer details
 */
export async function saveOrganization(orgName, domain, admin, officers) {
  const orgRef = doc(collection(db, "organizations"));
  await setDoc(orgRef, {
    orgName,
    domain,
    admin,
    officers,
    createdAt: serverTimestamp(),
  });
  return orgRef.id;
}

/**
 * ✅ Logout current user
 */
export async function logoutUser() {
  return await signOut(auth);
}
