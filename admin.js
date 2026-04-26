import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  addDoc,
  collection,
  onSnapshot,
  deleteDoc,
  query,
  orderBy,
  getDocs,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= MONITOR CORE (NEVER FAILS) ================= */
function log(msg) {
  const box = document.getElementById("monitor");
  if (!box) return;

  const time = new Date().toLocaleTimeString();
  const line = document.createElement("div");
  line.textContent = `[${time}] ${msg}`;

  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

/* ================= SAFE BOOT (ALWAYS RUNS) ================= */
window.addEventListener("DOMContentLoaded", () => {
  const box = document.getElementById("monitor");

  if (!box) {
    console.error("❌ Monitor element missing");
    return;
  }

  box.innerHTML = "🟢 MCN Admin Booting...";
  log("📡 DOM ready");
  log("🖥 Monitor initialized");

  // failsafe so you ALWAYS see something
  setTimeout(() => {
    log("⏳ Waiting for authentication...");
  }, 500);
});

/* ================= AUTH SYSTEM (FIXED SAFE VERSION) ================= */
onAuthStateChanged(auth, async (user) => {
  try {
    const box = document.getElementById("monitor");

    if (!box) return;

    if (!user) {
      log("❌ No user detected → redirecting");
      location.href = "index.html";
      return;
    }

    log("🔐 User detected, verifying admin...");

    const snap = await getDoc(doc(db, "users", user.uid));
    const role = snap.exists() ? snap.data().role : "user";

    if (role !== "admin") {
      log("⛔ Access denied (not admin)");
      alert("Access denied");
      location.href = "dashboard.html";
      return;
    }

    log("✅ Admin verified");
    log("🚀 System online");

    startSystem();

  } catch (err) {
    console.error(err);
    log("❌ Auth error (Firestore or network issue)");
  }
});

/* ================= SYSTEM START ================= */
function startSystem() {
  loadUsers();
  loadPosts();
  loadAdRequests();

  log("📦 Admin modules loaded");
}

/* ================= BROADCAST ================= */
window.sendBroadcast = async () => {
  const title = document.getElementById("broadcastTitle");
  const message = document.getElementById("broadcastMessage");

  if (!title || !message) return;

  if (!title.value || !message.value) {
    log("⚠️ Fill broadcast fields");
    return;
  }

  try {
    await addDoc(collection(db, "broadcasts"), {
      title: title.value,
      message: message.value,
      createdAt: Date.now(),
      createdBy: auth.currentUser.uid,
      active: true
    });

    log(`🔔 Broadcast sent: ${title.value}`);

    title.value = "";
    message.value = "";

  } catch (err) {
    console.error(err);
    log("❌ Broadcast failed");
  }
};

/* ================= USERS ================= */
function loadUsers() {
  const box = document.getElementById("usersList");
  if (!box) return;

  onSnapshot(collection(db, "onlineUsers"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const u = d.data();
      box.innerHTML += `<div class="item">👤 ${u.email || "user"}</div>`;
    });

    const stat = document.getElementById("statUsers");
    if (stat) stat.innerText = snap.size;
  });
}

/* ================= POSTS ================= */
function loadPosts() {
  const box = document.getElementById("postsList");
  if (!box) return;

  onSnapshot(query(collection(db, "posts"), orderBy("time")), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const p = d.data();

      box.innerHTML += `
        <div class="item">
          ${p.text || ""}
          <button onclick="deletePost('${d.id}')">Delete</button>
        </div>
      `;
    });
  });
}

window.deletePost = async (id) => {
  await deleteDoc(doc(db, "posts", id));
  log("🗑 Post deleted");
};

window.clearAllPosts = async () => {
  const snap = await getDocs(collection(db, "posts"));
  const batch = writeBatch(db);

  snap.forEach(d => batch.delete(d.ref));

  await batch.commit();
  log("🧹 All posts cleared");
};

/* ================= AD REQUESTS ================= */
function loadAdRequests() {
  const box = document.getElementById("upgradeList");
  if (!box) return;

  onSnapshot(collection(db, "adRequests"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const ad = d.data();

      box.innerHTML += `
        <div class="item">
          📢 ${ad.title || "No title"}<br>
          Status: ${ad.status || "pending"}
        </div>
      `;
    });

    const stat = document.getElementById("statRequests");
    if (stat) stat.innerText = snap.size;
  });
}

/* ================= STATS ================= */
window.loadStats = async () => {
  try {
    const blogs = await getDocs(collection(db, "blogs"));

    const stat = document.getElementById("statViews");
    if (stat) stat.innerText = blogs.size;

    log("📊 Stats updated");

  } catch (err) {
    console.error(err);
    log("❌ Stats failed");
  }
};