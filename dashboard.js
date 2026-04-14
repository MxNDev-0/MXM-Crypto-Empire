import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let username = "User";

onAuthStateChanged(auth, (user) => {
  if (!user) location.href = "index.html";
  listenChat();
  listenUsers();
  listenPosts();
});

/* ✅ FIXED CHAT (NOW WORKS) */
window.sendMessage = async () => {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();

  if (!text) return;

  await addDoc(collection(db, "chat"), {
    name: username,
    text,
    time: Date.now()
  });

  input.value = "";
};

/* REALTIME CHAT */
function listenChat() {
  const q = query(collection(db, "chat"), orderBy("time"));

  onSnapshot(q, (snap) => {
    const box = document.getElementById("chatBox");
    box.innerHTML = "";

    snap.forEach(d => {
      const m = d.data();
      box.innerHTML += `
        <div style="padding:5px">
          <b>${m.name}</b>: ${m.text}
        </div>`;
    });

    box.scrollTop = box.scrollHeight;
  });
}

/* USERS COUNT FIX */
function listenUsers() {
  onSnapshot(collection(db, "users"), (snap) => {
    const box = document.getElementById("onlineUsers");
    box.innerHTML = "Online: " + snap.size;
  });
}

/* POSTS */
function listenPosts() {
  onSnapshot(collection(db, "posts"), (snap) => {
    const box = document.getElementById("posts");
    box.innerHTML = "";

    snap.forEach(d => {
      const p = d.data();
      box.innerHTML += `
        <div class="post">
          <b>${p.user}</b>
          <p>${p.text}</p>
        </div>`;
    });
  });
}

window.logout = () =>
  signOut(auth).then(() => location.href = "index.html");