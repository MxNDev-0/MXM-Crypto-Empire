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
  orderBy,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;
let userData = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) {
    location.href = "index.html";
    return;
  }

  user = u;

  await ensureUser();
  await loadUser();

  loadUsers();
  loadFeed();
});

/* ================= USER ================= */
async function ensureUser() {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,
      username: user.email.split("@")[0],
      role: "user",
      isPremium: false
    });
  }
}

async function loadUser() {
  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists()) userData = snap.data();
}

/* ================= USERS ================= */
function loadUsers() {
  const box = document.getElementById("onlineUsers");
  if (!box) return;

  onSnapshot(collection(db, "onlineUsers"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const u = d.data();

      box.innerHTML += `
        <div class="user-item">
          <span>${u.username || "user"}</span>
        </div>
      `;
    });
  });
}

/* ================= FEED ================= */
function loadFeed() {
  const box = document.getElementById("chatBox");
  if (!box) return;

  const q = query(collection(db, "posts"), orderBy("time", "desc"));

  onSnapshot(q, (snap) => {
    box.innerHTML = "";

    if (snap.empty) {
      box.innerHTML = "<p style='opacity:0.6;'>No posts yet...</p>";
      return;
    }

    snap.forEach(docSnap => {
      const m = docSnap.data();

      if (!m || !m.text) return;

      box.innerHTML += `
        <div class="msg" style="margin:6px 0;padding:6px;background:#0b132b;border-radius:6px;">
          <b>${m.user || "user"}</b><br/>
          ${m.text}
        </div>
      `;
    });

    box.scrollTop = box.scrollHeight;
  });
}

/* ================= SEND MESSAGE ================= */
window.sendMessage = async function () {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();

  if (!text) return;

  await addDoc(collection(db, "posts"), {
    text,
    user: user.email.split("@")[0],
    time: serverTimestamp()
  });

  input.value = "";
};

/* ================= MENU ================= */
window.toggleMenu = function () {
  const menu = document.getElementById("menu");
  if (!menu) return;

  menu.classList.toggle("active");
};

/* ================= LOGOUT ================= */
window.logout = async function () {
  try {
    await signOut(auth);
    location.href = "index.html";
  } catch (err) {
    console.error("Logout error:", err);
  }
};

/* ================= NAVIGATION ================= */
window.goHome = () => location.href = "dashboard.html";
window.goProfile = () => location.href = "profile.html";
window.goAdmin = () => location.href = "admin.html";
window.goPremium = () => location.href = "premium.html";
window.support = () => alert("Support coming soon");

/* ================= FIXED MISSING BUTTONS ================= */
window.goFaq = () => location.href = "faq.html";
window.goAbout = () => location.href = "about.html";
window.goBlog = () => location.href = "blog/index.html";