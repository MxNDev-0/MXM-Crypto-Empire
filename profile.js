import { auth, db, storage } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// LOAD USER
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("userEmail").innerText = user.email;

  const snap = await getDoc(doc(db, "users", user.uid));

  document.getElementById("userPremium").innerText =
    snap.data()?.premium ? "Premium 💎" : "Free User";
});

// BACK
window.goBack = () => window.location.href = "dashboard.html";

// UPLOAD IMAGE
window.uploadImage = async function () {
  const file = document.getElementById("fileInput").files[0];

  if (!file) return alert("Select file");

  const storageRef = ref(storage, "uploads/" + file.name);

  await uploadBytes(storageRef, file);

  const url = await getDownloadURL(storageRef);

  document.getElementById("imagePreview").innerHTML =
    `<img src="${url}" width="100%">`;
};