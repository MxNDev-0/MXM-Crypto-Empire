import { auth, db } from "./firebase.js";
import { app } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc, setDoc, addDoc, collection,
  onSnapshot, deleteDoc,
  query, orderBy, getDocs, writeBatch, getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= MONITOR ================= */
function log(msg) {
  const box = document.getElementById("monitor");
  if (!box) return;

  const time = new Date().toLocaleTimeString();
  const line = document.createElement("div");

  line.textContent = `[${time}] ${msg}`;
  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

/* ================= BOOT ================= */
window.addEventListener("DOMContentLoaded", () => {
  const box = document.getElementById("monitor");

  if (box) {
    box.innerHTML = "";
    log("🟢 MCN Admin Monitor Online");
    log("📡 System connected");
  }

  // INIT SYSTEMS
  loadUsers();
  loadPosts();
  loadAdRequests();
  loadSuggestions();
});

/* ================= EMAILJS ================= */
const script = document.createElement("script");
script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";
document.head.appendChild(script);

script.onload = () => {
  try {
    emailjs.init("X26w77fp9rDGN2et7");
    log("📧 EmailJS ready");
  } catch {
    log("⚠️ EmailJS failed");
  }
};

/* ================= BROADCAST ================= */
window.sendBroadcast = async () => {
  const title = document.getElementById("broadcastTitle").value;
  const message = document.getElementById("broadcastMessage").value;

  if (!title || !message) {
    log("⚠️ Fill broadcast fields");
    return;
  }

  try {
    await addDoc(collection(db, "broadcasts"), {
      title,
      message,
      createdAt: Date.now(),
      createdBy: auth.currentUser?.uid || "admin",
      active: true
    });

    log("🔔 Broadcast sent: " + title);

    document.getElementById("broadcastTitle").value = "";
    document.getElementById("broadcastMessage").value = "";

  } catch (err) {
    console.error(err);
    log("❌ Broadcast failed");
  }
};

/* ================= ADMIN GUARD ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "index.html";

  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    const role = snap.exists() ? snap.data().role : "user";

    if (role !== "admin") {
      alert("Access denied");
      location.href = "dashboard.html";
    } else {
      log("🔐 Admin logged in");
    }
  } catch {
    log("❌ Auth error");
  }
});

/* ================= BLOG ================= */
window.createBlog = async () => {
  const title = blogTitle.value;
  const content = blogContent.value;
  const image = blogImage.value;

  if (!title || !content) return alert("Fill fields");

  try {
    await fetch("https://mxm-backend.onrender.com/blog/create", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ title, content, image })
    });

    log("📝 Blog created: " + title);

  } catch {
    log("❌ Blog failed");
  }
};

/* ================= POSTS ================= */
function loadPosts() {
  const box = document.getElementById("postsList");

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

  onSnapshot(collection(db, "onlineUsers"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const u = d.data();
      box.innerHTML += `<div class="item">${u.email || "user"}</div>`;
    });

    const stat = document.getElementById("statUsers");
    if (stat) stat.innerText = snap.size;
  });
}

/* ================= AD REQUESTS ================= */
function loadAdRequests() {
  const box = document.getElementById("upgradeList");

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

    const stat = document.getElementById("statRequests");
    if (stat) stat.innerText = snap.size;
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

/* ================= ANALYTICS ================= */
window.loadStats = async () => {
  const blogs = await getDocs(collection(db, "blogs"));
  const ads = await getDocs(collection(db, "ads"));

  let clicks = 0;
  ads.forEach(d => clicks += d.data().clicks || 0);

  document.getElementById("statViews").innerText = blogs.size;
  document.getElementById("statClicks").innerText = clicks;

  log("📊 Stats updated");
};