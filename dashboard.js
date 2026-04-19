import { auth, db } from "./firebase.js";

// SAFE IMPORT (prevents full crash if engine.js fails)
let isAllowed = () => true;
let isPremiumAllowed = () => true;

try {
  const engine = await import("./engine.js");
  isAllowed = engine.isAllowed || isAllowed;
  isPremiumAllowed = engine.isPremiumAllowed || isPremiumAllowed;
} catch (e) {
  console.warn("Engine module failed to load, running in fallback mode.");
}

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

/* ================= SAFE BOOT ================= */
onAuthStateChanged(auth, async (u) => {
  try {
    if (!u) {
      location.href = "index.html";
      return;
    }

    user = u;

    await ensureUser();
    await loadUser();

    setupUI(); // always runs AFTER user load

    loadUsers();
    loadFeed();

  } catch (err) {
    console.error("BOOT ERROR:", err);
  }
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
  userData = snap.exists() ? snap.data() : { role: "user", isPremium: false };
}

/* ================= UI INIT (CRITICAL FIX) ================= */
function setupUI() {
  window.toggleMenu = function () {
    const menu = document.getElementById("menu");
    if (menu) menu.classList.toggle("active");
  };

  window.logout = async function () {
    await signOut(auth);
    location.href = "index.html";
  };

  window.sendMessage = async function () {
    const input = document.getElementById("chatInput");
    const text = input?.value?.trim();

    if (!text) return;

    await addDoc(collection(db, "posts"), {
      text,
      user: user.email.split("@")[0],
      time: serverTimestamp()
    });

    input.value = "";
  };

  // NAV BUTTONS (NO MORE DEAD BUTTONS)
  window.goHome = () => location.href = "dashboard.html";
  window.goProfile = () => location.href = "profile.html";
  window.goAdmin = () => {
    if (userData?.role !== "admin") {
      alert("Admin only area");
      return;
    }
    location.href = "admin.html";
  };

  window.goPremium = () => location.href = "premium.html";
  window.support = () => alert("Support coming soon");
  window.goFaq = () => location.href = "faq.html";
  window.goAbout = () => location.href = "about.html";
  window.goBlog = () => location.href = "blog/index.html";

  window.openDeveloper = () => {
    if (!userData?.isPremium) {
      alert("Upgrade to Premium to access Developer tools");
      return;
    }
    alert("Developer access granted (placeholder)");
  };
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
      if (!m?.text) return;

      box.innerHTML += `
        <div style="margin:6px 0;padding:6px;background:#0b132b;border-radius:6px;">
          <b>${m.user || "user"}</b><br/>
          ${m.text}
        </div>
      `;
    });

    box.scrollTop = box.scrollHeight;
  });
}