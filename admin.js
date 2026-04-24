import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc, setDoc, addDoc, collection,
  onSnapshot, deleteDoc, updateDoc,
  query, orderBy, getDocs, writeBatch, getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= EMAILJS INIT ================= */
import "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";

emailjs.init("X26w77fp9rDGN2et7");

/* ================= ADMIN GUARD ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "index.html";

  const snap = await getDoc(doc(db, "users", user.uid));
  const role = snap.exists() ? snap.data().role : "user";

  if (role !== "admin") {
    alert("Access denied");
    location.href = "dashboard.html";
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

/* ================= SEND EMAIL ================= */
function sendEmail(message) {
  emailjs.send("service_faxlkup", "template_0f9tfzw", {
    name: "MCN Engine",
    email: "mcnengine@gmail.com",
    message: message,
    time: new Date().toLocaleString()
  }).then(() => {
    log("📩 Email sent");
  }).catch(err => {
    console.error(err);
    log("❌ Email failed");
  });
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
          ${ad.title} (${ad.duration})<br>
          Status: ${ad.status}
          <br>
          <button onclick="approveAd('${d.id}')">Approve</button>
          <button onclick="rejectAd('${d.id}')">Reject</button>
        </div>
      `;
    });

    document.getElementById("statRequests").innerText = snap.size;
  });
}

/* ================= APPROVE ================= */
window.approveAd = async (id) => {
  await updateDoc(doc(db, "adRequests", id), {
    status: "approved"
  });

  log("Ad approved");
  sendEmail("Ad request approved");
};

/* ================= REJECT ================= */
window.rejectAd = async (id) => {
  await updateDoc(doc(db, "adRequests", id), {
    status: "rejected"
  });

  log("Ad rejected");
  sendEmail("Ad request rejected");
};

/* ================= USERS ================= */
function loadUsers() {
  const box = document.getElementById("usersList");

  onSnapshot(collection(db, "onlineUsers"), (snap) => {
    box