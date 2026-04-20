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

const API = "https://mxm-backend.onrender.com";

let user = null;
let userData = null;
let isAdmin = false;
let adsLoaded = false;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) {
    location.href = "index.html";
    return;
  }

  user = u;

  await ensureUser();
  await loadUser();

  isAdmin = userData?.role === "admin";

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
      role: "user"
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

/* ================= FEED (CHAT SYSTEM FIXED) ================= */
function loadFeed() {
  const box = document.getElementById("chatBox");
  if (!box) return;

  const q = query(collection(db, "posts"), orderBy("time", "asc"));

  onSnapshot(q, (snap) => {
    box.innerHTML = "";

    snap.forEach(docSnap => {

      const m = docSnap.data();
      if (!m) return;

      const text = m.text || "[empty message]";
      const userName = m.user || "guest";

      const time = m.time?.toDate
        ? m.time.toDate().toLocaleTimeString()
        : "";

      box.innerHTML += `
        <div class="msg" style="
          margin:6px 0;
          padding:8px;
          background:#1c2541;
          border-radius:6px;
          font-size:13px;
        ">
          <b>${userName}</b>: ${text}
          <div style="font-size:10px;opacity:0.6;">${time}</div>
        </div>
      `;
    });

    /* AUTO SCROLL */
    box.scrollTop = box.scrollHeight;

    /* LOAD ADS ONCE */
    loadAdsIntoDashboard();
  });
}

/* ================= ADS SYSTEM ================= */
async function loadAdsIntoDashboard() {
  const box = document.getElementById("chatBox");
  if (!box) return;

  if (adsLoaded) return;
  adsLoaded = true;

  try {
    const res = await fetch(`${API}/ads/list`);
    const ads = await res.json();

    ads.forEach(ad => {
      box.innerHTML += `
        <div style="
          margin:8px 0;
          padding:10px;
          border:1px dashed #5bc0be;
          border-radius:8px;
          background:#16213e;
        ">
          <div style="font-size:10px;color:#5bc0be;">SPONSORED</div>
          <b>${ad.title}</b><br/>
          <span style="font-size:13px;">${ad.text}</span><br/>

          <button onclick="openAd('${ad.id}','${ad.link}')">
            Open Ad
          </button>
        </div>
      `;
    });

  } catch (err) {
    console.log("Ads failed", err);
  }
}

/* ================= AD CLICK ================= */
window.openAd = function (id, link) {
  fetch(`${API}/ads/click/${id}`, { method: "POST" });
  window.location.href = link;
};

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

/* ================= ADMIN ================= */
window.goAdmin = () => {
  if (!userData) return alert("Loading...");
  if (!isAdmin) return alert("❌ Admin only");
  location.href = "admin.html";
};

/* ================= ADS ================= */
window.goAdSpace = () => location.href = "ads.html";

window.support = () => alert("Support coming soon");
window.goFaq = () => location.href = "faq.html";
window.goAbout = () => location.href = "about.html";
window.goBlog = () => location.href = "blog/index.html";

/* ================= DEVELOPER ================= */
window.openDeveloper = () => {
  alert("Developer tools coming soon");
};
