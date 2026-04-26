import { auth, db } from "./firebase.js";
import { app } from "./firebase.js"; // ✅ IMPORTANT (use same app)

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc, setDoc, addDoc, collection,
  onSnapshot, deleteDoc, updateDoc,
  query, orderBy, getDocs, writeBatch, getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= EMAILJS (SAFE LOAD) ================= */
const script = document.createElement("script");
script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";
document.head.appendChild(script);

script.onload = () => {
  emailjs.init("X26w77fp9rDGN2et7");
  log("📧 EmailJS ready");
};

/* ================= FIREBASE PUSH (FIXED) ================= */
import {
  getMessaging,
  getToken,
  onMessage
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

const messaging = getMessaging(app);

/* ================= REQUEST PERMISSION ================= */
async function enablePush() {
  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: "BMtRVhjhwqYJ9Gn5Imp5ZuqdeY_N4lX9mUiGg9uJoHl3-kH2b5vXTG6cp1zAtAxZe3eOLviglmOklScCIBWFIm4"
      });

      log("🔔 Push enabled");

      // ✅ SAVE TOKEN TO FIRESTORE
      await setDoc(doc(db, "pushTokens", auth.currentUser.uid), {
        token: token,
        time: Date.now()
      });

      log("📱 Token saved");

    } else {
      log("❌ Notification denied");
    }
  } catch (err) {
    console.error(err);
    log("❌ Push error");
  }
}

/* ================= LISTEN FOR PUSH ================= */
onMessage(messaging, (payload) => {
  log("📩 Push received: " + payload.notification.title);

  new Notification(payload.notification.title, {
    body: payload.notification.body
  });
});

/* ================= EMAIL FUNCTION ================= */
function sendEmail(message) {
  if (typeof emailjs === "undefined") {
    log("⚠️ EmailJS not loaded");
    return;
  }

  emailjs.send("service_faxlkup", "template_0f9tfzw", {
    message: message,
    time: new Date().toLocaleString()
  })
  .then(() => {
    log("📩 Email sent");
  })
  .catch(err => {
    console.error(err);
    log("❌ Email failed");
  });
}

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

    // 🔔 ENABLE PUSH AFTER LOGIN
    enablePush();
  }
});

/* ================= MONITOR ================= */
function log(msg) {
  const box = document.getElementById("monitor");
  if (!box) return;

  const time = new Date().toLocaleTimeString();
  box.innerHTML += `[${time}] ${msg}<br>`;
  box.scrollTop = box.scrollHeight;
}

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

    sendEmail("New blog created: " + title);
  }
};

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
          Status: ${ad.status || "pending"}<br>
          Created: ${ad.createdAt || "unknown"}
        </div>
      `;
    });

    document.getElementById("statRequests").innerText = snap.size;
  });
}

/* ================= USERS ================= */
function loadUsers() {
  const box = document.getElementById("usersList");

  onSnapshot(collection(db, "onlineUsers"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const u = d.data();

      box.innerHTML += `
        <div class="item">${u.email || "user"}</div>
      `;
    });

    document.getElementById("statUsers").innerText = snap.size;
  });
}

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

/* ================= SUGGESTIONS ================= */
function loadSuggestions() {
  const box = document.getElementById("suggestionsBox");
  if (!box) return;

  onSnapshot(collection(db, "suggestions"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const s = d.data();

      box.innerHTML += `
        <div class="item">
          💡 ${s.text || "No text"}
        </div>
      `;
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

  log("Stats refreshed");
};

/* ================= INIT ================= */
loadUsers();
loadPosts();
loadAdRequests();
loadSuggestions();

log("🚀 System ready");