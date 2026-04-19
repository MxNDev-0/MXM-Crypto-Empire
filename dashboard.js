import { auth, db } from "./firebase.js";
import { isAllowed, isPremiumAllowed } from "./engine.js";

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
let isUserReady = false;

/* ================= AUTH BOOT ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) {
    location.href = "index.html";
    return;
  }

  try {
    user = u;

    await ensureUser();
    await loadUser();

    isUserReady = true;

    applyUIRestrictions();

    loadUsers();
    loadFeed();

  } catch (err) {
    console.error("BOOT ERROR:", err);
    alert("Failed to load dashboard. Check console.");
  }
});

/* ================= USER SETUP ================= */
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
  try {
    const snap = await getDoc(doc(db, "users", user.uid));

    if (snap.exists()) {
      userData = snap.data();
    } else {
      userData = {
        role: "user",
        isPremium: false
      };
    }
  } catch (err) {
    console.error("loadUser error:", err);

    userData = {
      role: "user",
      isPremium: false
    };
  }
}

/* ================= UI RESTRICTIONS ================= */
function applyUIRestrictions() {
  if (!userData) return;

  const premiumButtons = document.querySelectorAll(".premium-only");
  if (!isPremiumAllowed(userData)) {
    premiumButtons.forEach(btn => btn.style.display = "none");
  }

  const adsSection = document.querySelectorAll(".ads-only");
  if (!isAllowed("ads", userData)) {
    adsSection.forEach(el => el.style.display = "none");
  }

  if (!isAllowed("chat", userData)) {
    const chatBox = document.getElementById("chatBox");
    if (chatBox) chatBox.innerHTML = "<p>Chat disabled</p>";
  }
}

/* ================= USERS ================= */
function loadUsers() {
  const box = document.getElementById("onlineUsers");
  if (!box) {
    console.error("onlineUsers missing in HTML");
    return;
  }

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
  }, (err) => {
    console.error("Users error:", err);
    box.innerHTML = "<p style='color:red;'>Failed to load users</p>";
  });
}

/* ================= FEED ================= */
function loadFeed() {
  const box = document.getElementById("chatBox");

  if (!box) {
    console.error("chatBox missing in HTML");
    return;
  }

  try {
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

    }, (err) => {
      console.error("Feed error:", err);
      box.innerHTML = "<p style='color:red;'>Feed failed to load</p>";
    });

  } catch (err) {
    console.error("loadFeed crash:", err);
  }
}

/* ================= SEND MESSAGE ================= */
window.sendMessage = async function () {
  if (!isUserReady) return;

  const input = document.getElementById("chatInput");
  const text = input.value.trim();

  if (!text) return;

  if (!isAllowed("chat", userData)) {
    alert("Chat disabled for your account");
    return;
  }

  await addDoc(collection(db, "posts"), {
    text,
    user: user.email.split("@")[0],
    time: serverTimestamp()
  });

  input.value = "";
};

/* ================= MENU ================= */
window.toggleMenu = function () {
  document.getElementById("menu").classList.toggle("active");
};

/* ================= LOGOUT ================= */
window.logout = async function () {
  await signOut(auth);
  location.href = "index.html";
};

/* ================= NAVIGATION ================= */
window.goHome = () => location.href = "dashboard.html";
window.goProfile = () => location.href = "profile.html";
window.goAdmin = () => location.href = "admin.html";
window.goPremium = () => location.href = "premium.html";
window.support = () => alert("Support coming soon");
window.goFaq = () => location.href = "faq.html";
window.goAbout = () => location.href = "about.html";
window.goBlog = () => location.href = "blog/index.html";