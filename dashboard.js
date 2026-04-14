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

let user = null;

/* AUTH */
onAuthStateChanged(auth, (u) => {
  if (!u) location.href = "index.html";

  user = u;

  loadFeed();
  loadUsers();
});

/* ================= FEED (CHAT + POSTS MERGED) ================= */
window.sendMessage = async () => {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();

  if (!text || !user) return;

  await addDoc(collection(db, "posts"), {
    text,
    user: user.email.split("@")[0],
    time: Date.now()
  });

  input.value = "";
};

function loadFeed() {
  const q = query(collection(db, "posts"), orderBy("time"));

  onSnapshot(q, (snap) => {
    const box = document.getElementById("chatBox");
    box.innerHTML = "";

    snap.forEach(d => {
      const m = d.data();

      box.innerHTML += `
        <div style="margin:6px 0;">
          <b style="color:#5bc0be;">${m.user}</b>
          <div style="color:white;">${m.text}</div>
        </div>
      `;
    });

    box.scrollTop = box.scrollHeight;
  });
}

/* ================= USERS ================= */
function loadUsers() {
  onSnapshot(collection(db, "users"), (snap) => {
    const box = document.getElementById("onlineUsers");

    let total = 0;
    let online = 0;

    box.innerHTML = "";

    snap.forEach(d => {
      const u = d.data();
      total++;

      if (u.email) {
        online++;
        box.innerHTML += `<div style="font-size:13px;">🟢 ${u.email.split("@")[0]}</div>`;
      }
    });

    const offline = total - online;

    box.innerHTML = `
      <div style="margin-bottom:6px;font-size:13px;">
        🟢 Online: ${online} | ⚪ Offline: ${offline}
      </div>
    ` + box.innerHTML;
  });
}

/* ================= MENU ================= */
window.toggleMenu = () => {
  const m = document.getElementById("menu");
  m.style.display = (m.style.display === "block") ? "none" : "block";
};

function closeMenu() {
  document.getElementById("menu").style.display = "none";
}

window.goHome = () => {
  closeMenu();
  location.reload();
};

window.goProfile = () => {
  closeMenu();
  location.href = "profile.html";
};

window.goAdmin = () => {
  closeMenu();

  if (user.email !== "nc.maxiboro@gmail.com") {
    alert("❌ Admin panel locked");
    return;
  }

  alert("✅ Welcome to Admin Office");
};

window.support = () => {
  closeMenu();
  alert("Support not active yet");
};

window.upgrade = () => {
  closeMenu();
  window.open("https://nowpayments.io/payment/?iid=5153003613");
};

/* LOGOUT */
window.logout = () => {
  signOut(auth).then(() => location.href = "index.html");
};