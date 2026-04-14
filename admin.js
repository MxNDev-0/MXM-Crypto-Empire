import { db } from "./firebase.js";

import {
  doc,
  setDoc,
  addDoc,
  collection,
  onSnapshot,
  deleteDoc,
  updateDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

/* ================= USERS ================= */
function loadUsers() {
  const box = document.getElementById("usersList");
  if (!box) return;

  onSnapshot(collection(db, "onlineUsers"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const u = d.data();

      box.innerHTML += `
        <div style="padding:6px;margin:5px;background:#1c2541;border-radius:6px;">
          <b>${u.email}</b>
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
        <div style="padding:6px;margin:5px;background:#0b132b;border-radius:6px;">
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

/* ================= CLEAR ALL POSTS ================= */
window.clearAllPosts = async () => {
  const snap = await getDocs(collection(db, "posts"));

  if (snap.empty) {
    alert("No posts found");
    return;
  }

  const ok = confirm("⚠️ Delete ALL posts permanently?");
  if (!ok) return;

  const batch = writeBatch(db);

  snap.forEach((docSnap) => {
    batch.delete(doc(db, "posts", docSnap.id));
  });

  await batch.commit();

  alert("✅ All posts deleted");
};

/* ================= 🚀 UPGRADE SYSTEM (FIXED PROPER VERSION) ================= */
function loadUpgrades() {
  const box = document.getElementById("upgradeList");
  if (!box) return;

  onSnapshot(collection(db, "upgradeRequests"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const u = d.data();
      const id = d.id;

      box.innerHTML += `
        <div style="padding:6px;margin:5px;background:#1c2541;border-radius:6px;">
          <b>${u.email}</b>
          <p>Status: ${u.status || "pending"}</p>

          <button onclick="approveUpgrade('${id}', '${u.uid}')">
            Approve
          </button>
        </div>
      `;
    });
  });
}

/* ================= APPROVE UPGRADE (FIXED) ================= */
window.approveUpgrade = async (requestId, uid) => {
  try {
    // upgrade user
    await updateDoc(doc(db, "users", uid), {
      premium: true,
      upgradedAt: Date.now()
    });

    // mark request handled
    await updateDoc(doc(db, "upgradeRequests", requestId), {
      status: "approved"
    });

    alert("User upgraded ✅");

  } catch (err) {
    console.error(err);
    alert("Upgrade failed ❌");
  }
};

/* ================= INIT ================= */
loadUsers();
loadPosts();
loadUpgrades();