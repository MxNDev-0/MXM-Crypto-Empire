import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  setDoc,
  addDoc,
  collection,
  onSnapshot,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  getDocs,
  writeBatch,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= ADMIN GUARD ================= */
const ADMIN_UID = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "index.html";
    return;
  }

  const snap = await getDoc(doc(db, "users", user.uid));
  const role = snap.exists() ? snap.data().role : "user";

  if ((ADMIN_UID && user.uid === ADMIN_UID) || role === "admin") {
    console.log("Admin access granted");
  } else {
    alert("❌ Access denied (Admin only)");
    location.href = "dashboard.html";
  }
});

/* ================= WALLET ================= */
window.updateWallet = async () => {
  const balance = document.getElementById("balanceInput").value;

  await setDoc(doc(db, "wallet", "main"), {
    balance: Number(balance),
    updatedAt: Date.now()
  });

  alert("Wallet updated!");
};

/* ================= EARNINGS ================= */
window.addEarning = async () => {
  const source = document.getElementById("source").value;
  const amount = document.getElementById("amount").value;

  await addDoc(collection(db, "earningsLog"), {
    source,
    amount: Number(amount),
    date: Date.now()
  });

  alert("Earning added!");
};

/* ================= BLOG CREATE (CLEAN FIX) ================= */
window.createBlog = async () => {
  const title = document.getElementById("blogTitle").value;
  const content = document.getElementById("blogContent").value;
  const image = document.getElementById("blogImage").value;

  if (!title || !content) {
    alert("Fill title and content");
    return;
  }

  try {
    const res = await fetch("https://mxm-backend.onrender.com/blog/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: title.trim(),
        content: content.trim(),
        image: image || ""
      })
    });

    const data = await res.json();

    if (data.success) {
      alert("Blog published successfully ✅");
    } else {
      alert("Blog failed to publish ❌");
    }

  } catch (err) {
    console.error(err);
    alert("Server error");
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

      box.innerHTML += `
        <div class="item">
          <b>${u.email || u.username || "user"}</b>
          <button onclick="banUser('${u.uid}')">Ban</button>
        </div>
      `;
    });
  });
}

/* ================= BAN USER ================= */
window.banUser = async (uid) => {
  await updateDoc(doc(db, "users", uid), {
    banned: true
  });

  alert("User banned ❌");
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
          <b>${p.user}</b>
          <p>${p.text}</p>
          <button onclick="deletePost('${d.id}')">Delete</button>
        </div>
      `;
    });
  });
}

/* ================= DELETE POST ================= */
window.deletePost = async (id) => {
  await deleteDoc(doc(db, "posts", id));
};

/* ================= CLEAR POSTS ================= */
window.clearAllPosts = async () => {
  const snap = await getDocs(collection(db, "posts"));
  const batch = writeBatch(db);

  snap.forEach(d => batch.delete(d.ref));

  await batch.commit();
  alert("All posts deleted");
};

/* ================= INIT ================= */
loadUsers();
loadPosts();