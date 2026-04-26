import { auth, db } from "./firebase.js";
import { app } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc, setDoc, addDoc, collection,
  onSnapshot, deleteDoc, updateDoc,
  query, orderBy, getDocs, writeBatch, getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= MONITOR (FIXED FIRST - CRITICAL) ================= */
function log(msg) {
  const box = document.getElementById("monitor");

  if (!box) {
    console.warn("MONITOR NOT READY:", msg);
    return;
  }

  const time = new Date().toLocaleTimeString();

  const line = document.createElement("div");
  line.textContent = `[${time}] ${msg}`;

  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

/* ================= EMAILJS ================= */
const script = document.createElement("script");
script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";
document.head.appendChild(script);

script.onload = () => {
  try {
    emailjs.init("X26w77fp9rDGN2et7");
    console.log("EmailJS ready");
  } catch (e) {
    console.log("EmailJS init failed");
  }
};

/* ================= PUSH ================= */
import {
  getMessaging,
  getToken,
  onMessage
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

let messaging;
try {
  messaging = getMessaging(app);
} catch (e) {
  console.log("Messaging init skipped");
}

/* ================= SAFE MONITOR BOOT ================= */
window.addEventListener("DOMContentLoaded", () => {
  const box = document.getElementById("monitor");

  if (box) {
    box.innerHTML = "🟢 Initializing MCN Engine Admin Monitor...";
  }

  setTimeout(() => {
    log("🚀 System ready");
    log("🔐 Admin panel active");
    log("📡 Live monitor online");
  }, 500);
});

/* ================= BROADCAST SYSTEM ================= */
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
      createdBy: auth.currentUser.uid,
      active: true
    });

    log(`🔔 Broadcast sent: ${title}`);
    log(`📢 ${message}`);

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

  const snap = await getDoc(doc(db, "users", user.uid));
  const role = snap.exists() ? snap.data().role : "user";

  if (role !== "admin") {
    alert("Access denied");
    location.href = "dashboard.html";
  } else {
    log("Admin logged in");
  }
});

/* ================= BLOG ================= */
window.createBlog = async () => {
  const title = blogTitle.value;
  const content = blogContent.value;
  const image = blogImage.value;

  if (!title || !content) return alert("Fill fields");

  const res = await fetch("https://mxm-backend.onrender.com/blog/create", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ title, content, image })
  });

  const data = await res.json();

  if (data.success) {
    alert("Blog posted ✅");

    blogTitle.value = "";
    blogContent.value = "";
    blogImage.value = "";

    log("Blog created: " + title);
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
  log("Post deleted");
};

window.clearAllPosts = async () => {
  const snap = await getDocs(collection(db, "posts"));
  const batch = writeBatch(db);

  snap.forEach(d => batch.delete(d.ref));

  await batch.commit();
  log("All posts cleared");
};

/* ================= INIT ================= */
loadPosts();

/* ================= FINAL MONITOR BOOT (SAFE) ================= */
setTimeout(() => {
  const box = document.getElementById("monitor");

  if (box) {
    box.innerHTML = "";
    log("🟢 MCN Admin Monitor Online");
    log("📡 System connected");
  } else {
    console.error("❌ Monitor element still missing");
  }
}, 800);