import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut,
  updatePassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const ADMIN_EMAIL = "nc.maxiboro@gmail.com";

let currentUser;
let username = null;

// AUTH
onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "index.html";

  currentUser = user;

  document.getElementById("userEmail").innerText = user.email;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, { username: "" });
  }

  username = (await getDoc(ref)).data().username;

  loadChat();
  loadOnlineUsers();
});

// MENU TOGGLE
window.toggleMenu = () => {
  const menu = document.getElementById("menu");
  menu.style.display = menu.style.display === "none" ? "block" : "none";
};

// NAVIGATION
window.goProfile = () => location.href = "profile.html";

window.goUpgrade = () =>
  location.href = "https://nowpayments.io/payment/?iid=5153003613";

window.goSupport = () =>
  location.href = "support.html";

window.goFAQ = () =>
  location.href = "faq.html";

window.openSupport = () =>
  alert("Contact support: support@mxmcrypto.com");

window.openMySection = () => {
  if (currentUser.email !== ADMIN_EMAIL) {
    alert("❌ You are not authorized to access this section.");
    return;
  }

  alert("👑 Welcome Admin Office");
};

// SET USERNAME
window.setUsername = async () => {
  const name = prompt("Enter username:");
  if (!name) return;

  await setDoc(doc(db, "users", currentUser.uid), {
    username: name
  });

  username = name;
  alert("Username saved");
};

// CHANGE PASSWORD
window.changePassword = async () => {
  const pass = prompt("New password:");
  await updatePassword(currentUser, pass);
  alert("Password updated");
};

// CHAT FIX (REAL TIME)
window.sendMessage = async () => {
  const input = document.getElementById("chatInput");
  const text = input.value;

  if (!username) {
    alert("Set username first");
    return;
  }

  if (!text) return;

  await addDoc(collection(db, "generalChat"), {
    name: username,
    text,
    time: Date.now()
  });

  input.value = "";
};

// REAL TIME CHAT LISTENER (FIXED)
function loadChat() {
  onSnapshot(collection(db, "generalChat"), (snap) => {
    const box = document.getElementById("chatBox");
    box.innerHTML = "";

    snap.forEach(doc => {
      const m = doc.data();

      box.innerHTML += `
        <div style="margin:5px;">
          <b>${m.name}</b>: ${m.text}
        </div>
      `;
    });
  });
}

// ONLINE USERS
function loadOnlineUsers() {
  onSnapshot(collection(db, "users"), (snap) => {
    const box = document.getElementById("onlineUsers");
    box.innerHTML = "";

    snap.forEach(doc => {
      const u = doc.data();

      if (u.username) {
        box.innerHTML += `<div>🟢 ${u.username}</div>`;
      }
    });
  });
}

// LOGOUT
window.logout = async () => {
  await signOut(auth);
  location.href = "index.html";
};