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
  writeBatch,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= MONITOR CORE ================= */
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

  if (box) box.innerHTML = "🟢 Admin Monitor Initializing...";

  setTimeout(() => {
    log("System ready");
    log("Monitor online");
  }, 500);
});

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "index.html";

  const snap = await getDoc(doc(db, "users", user.uid));
  const role = snap.exists() ? snap.data().role : "user";

  if (role !== "admin") {
    alert("Access denied");
    location.href = "dashboard.html";
    return;
  }

  log("Admin verified");
  startSystem();
});

/* ================= SYSTEM ================= */
function startSystem() {
  loadUsers();
  loadPosts();
  loadAdRequests();
  loadEventMonitor(); // 🔥 NEW UNIFIED MONITOR
}

/* ================= UNIFIED MONITOR (CHAT + LOGS) ================= */
function loadEventMonitor() {
  const box = document.getElementById("monitor");
  if (!box) return;

  onSnapshot(query(collection(db, "events"), orderBy("createdAt", "asc")), (snap) => {
    box.innerHTML = "";

    snap.forEach(docSnap => {
      const e = docSnap.data();

      if (e.type === "chat") {
        box.innerHTML += `
          <div style="padding:6px;border-bottom:1px solid #222;">
            💬 <b onclick="openUser('${e.uid}')">${e.username}</b>: ${e.text}
            <button onclick="replyToUser('${e.uid}')">↩</button>
          </div>
        `;
      }

      if (e.type === "log") {
        box.innerHTML += `
          <div style="color:#00ff66;">
            [LOG] ${e.text}
          </div>
        `;
      }
    });

    box.scrollTop = box.scrollHeight;
  });
}

/* ================= BROADCAST ================= */
window.sendBroadcast = async () => {
  const title = document.getElementById("broadcastTitle");
  const message = document.getElementById("broadcastMessage");

  if (!title.value || !message.value) {
    log("Fill fields");
    return;
  }

  await addDoc(collection(db, "broadcasts"), {
    title: title.value,
    message: message.value,
    createdAt: serverTimestamp(),
    active: true
  });

  log("Broadcast sent");

  title.value = "";
  message.value = "";
};

/* ================= USERS ================= */
function loadUsers() {
  const box = document.getElementById("usersList");
  if (!box) return;

  onSnapshot(collection(db, "onlineUsers"), (snap) => {
    box.innerHTML = "";
    snap.forEach(d => {
      box.innerHTML += `<div class="item">${d.data().email}</div>`;
    });
  });
}

/* ================= POSTS ================= */
function loadPosts() {
  const box = document.getElementById("postsList");
  if (!box) return;

  onSnapshot(query(collection(db, "posts"), orderBy("time")), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      box.innerHTML += `
        <div class="item">
          ${d.data().text}
          <button onclick="deletePost('${d.id}')">Delete</button>
        </div>
      `;
    });
  });
}

window.deletePost = async (id) => {
  await deleteDoc(doc(db, "posts", id));
  log("Post deleted");
};

window.clearAllPosts = async () => {
  const snap = await getDocs(collection(db, "posts"));
  const batch = writeBatch(db);

  snap.forEach(d => batch.delete(d.ref));

  await batch.commit();
  log("All posts cleared");
};

/* ================= AD REQUESTS ================= */
function loadAdRequests() {
  const box = document.getElementById("upgradeList");
  if (!box) return;

  onSnapshot(collection(db, "adRequests"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      box.innerHTML += `
        <div class="item">
          ${d.data().title}
        </div>
      `;
    });
  });
}

/* ================= QUICK ACTIONS ================= */
window.openUser = (uid) => {
  alert("Open user profile: " + uid);
};

window.replyToUser = (uid) => {
  alert("Reply to user: " + uid);
};