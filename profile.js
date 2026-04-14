import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;

onAuthStateChanged(auth, (u) => {
  if (!u) location.href = "index.html";
  user = u;

  loadPosts();
});

/* ✅ PROFILE POST FIXED */
window.createPost = async () => {
  const input = document.getElementById("postInput");
  const text = input.value.trim();

  if (!text) return;

  await addDoc(collection(db, "posts"), {
    text,
    user: user.email.split("@")[0],
    time: Date.now()
  });

  input.value = "";
};

function loadPosts() {
  const q = query(collection(db, "posts"), orderBy("time"));

  onSnapshot(q, (snap) => {
    const box = document.getElementById("profilePosts");
    box.innerHTML = "";

    snap.forEach(doc => {
      const p = doc.data();

      if (p.user === user.email.split("@")[0]) {
        box.innerHTML += `
          <div style="margin:6px 0;">
            <div style="color:#fff;">${p.text}</div>
          </div>
        `;
      }
    });
  });
}

/* MENU */
window.toggleMenu = () => {
  const m = document.getElementById("menu");
  m.style.display = (m.style.display === "block") ? "none" : "block";
};

window.goDashboard = () => location.href = "dashboard.html";