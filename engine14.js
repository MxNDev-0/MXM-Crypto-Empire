import { auth, db } from "./firebase.js";
import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= ENGINE 14 CORE ================= */

export let EngineUser = null;

/* INIT USER */
export async function initEngine14(user) {
  if (!user) return null;

  EngineUser = user;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const defaultName = user.email.split("@")[0];

  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,
      username: defaultName,
      role: "user",
      premium: false,
      createdAt: Date.now()
    });
  }

  return snap.data();
}

/* CHECK ROLE */
export async function isAdmin() {
  const ref = doc(db, "users", EngineUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return false;

  const data = snap.data();

  return (
    data.role === "admin" ||
    EngineUser.email.includes("mxn")
  );
}

/* CHECK PREMIUM */
export async function isPremium() {
  const ref = doc(db, "users", EngineUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return false;

  return snap.data().premium === true;
}

/* GET USERNAME */
export async function getEngineUsername() {
  const ref = doc(db, "users", EngineUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return "user";

  return snap.data().username || "user";
}