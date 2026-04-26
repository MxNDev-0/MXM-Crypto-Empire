import { auth, db } from "./firebase.js";
import { app } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc, setDoc, addDoc, collection,
  onSnapshot, deleteDoc,
  query, orderBy, getDocs, writeBatch, getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= HARD MONITOR FIX ================= */
function log(msg) {
  let box = document.getElementById("monitor");

  // 🔥 FORCE CREATE IF MISSING
  if (!box) {
    box = document.createElement("div");
    box.id = "monitor";
    box.style.background = "#000";
    box.style.color = "#00ff66";
    box.style.padding = "10px";
    box.style.margin = "10px";
    box.style.height = "200px";
    box.style.overflowY = "auto";

    document.body.prepend(box);
  }

  const time = new Date().toLocaleTimeString();

  const line = document.createElement("div");
  line.textContent = `[${time}] ${msg}`;

  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

/* ================= FORCE BOOT ================= */
window.onload = () => {
  log("🟢 FORCED BOOT START");
  log("📡 Connecting systems...");
};

/* ================= DELAYED INIT ================= */
setTimeout(() => {
  log("🚀 System initialized");
  startSystem();
}, 500);

/* ================= SYSTEM START ================= */
function startSystem() {
  loadUsers();
  loadPosts();
  loadAdRequests();
  loadSuggestions();
}

/* ================= BROADCAST ================= */
window.sendBroadcast = async () => {
  const title = document.getElementById("broadcastTitle").value;
  const message = document.getElementById("broadcastMessage").value;

  if (!title || !message) {
    log("⚠️ Fill broadcast fields");
    return;
  }

  await addDoc(collection(db, "broadcasts"), {
    title,
    message,
    createdAt: Date.now(),
    createdBy: auth.currentUser?.uid || "admin",
    active: true
  });

  log("🔔 Broadcast sent: " + title);
};

/* ================= ADMIN GUARD ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "index.html";

  const snap = await getDoc(doc(db, "users", user.uid));
  const role = snap.exists() ? snap.data().role : "user";

  if (role !== "admin") {
    alert("Access denied");
    location.href = "dashboard.html";
  } else {
    log("🔐 Admin logged in");
  }
});

/* ================= BLOG ================= */
window.createBlog = async () => {
  const title = blogTitle.value;
  const content = blogContent.value;
  const image = blogImage.value;

  if (!title || !content) return alert("Fill fields");

  await fetch("https://mxm-backend.onrender.com/blog/create", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ title, content, image })
  });

  log("📝 Blog created: " + title);
};

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
          ${p.text}
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

/* ================= USERS ================= */
function loadUsers() {
  const box = document.getElementById("usersList");
  if (!box) return;

  onSnapshot(collection(db, "onlineUsers"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const u = d.data();
      box.innerHTML += `<div class="item">${u.email || "user"}</div>`;
    });
  });
}

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
          ${ad.title}<br>
          ${ad.status || "pending"}
        </div>
      `;
    });
  });
}

/* ================= SUGGESTIONS ================= */
function loadSuggestions() {
  const box = document.getElementById("suggestionsBox");
  if (!box) return;

  onSnapshot(collection(db, "suggestions"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const s = d.data();
      box.innerHTML += `<div class="item">💡 ${s.text || "No text"}</div>`;
    });
  });
}