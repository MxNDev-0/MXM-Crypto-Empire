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
  setDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;

/* ================= AUTH CHECK ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) location.href = "index.html";
  user = u;

  // ✅ MARK USER ONLINE
  await setDoc(doc(db, "onlineUsers", user.uid), {
    email: user.email,
    lastActive: Date.now()
  });

  // ✅ AUTO REMOVE ON TAB CLOSE
  window.addEventListener("beforeunload", async () => {
    try {
      await deleteDoc(doc(db, "onlineUsers", user.uid));
    } catch (e) {}
  });

  loadFeed();
  loadWallet();
  loadBTCPrice();
  trackOnlineUsers(); // NEW
});

/* ================= ONLINE USERS SYSTEM ================= */
function trackOnlineUsers() {
  const usersRef = collection(db, "onlineUsers");

  onSnapshot(usersRef, (snap) => {
    const usersDiv = document.getElementById("onlineUsers");

    if (!usersDiv) return;

    usersDiv.innerHTML = "";

    let count = 0;

    snap.forEach(docSnap => {
      const data = docSnap.data();
      count++;

      usersDiv.innerHTML += `
        <div style="margin:4px 0;">
          🟢 ${data.email}
        </div>
      `;
    });

    // ✅ SHOW COUNT IN TITLE
    usersDiv.innerHTML =
      `<b>Total Online: ${count}</b><hr>` + usersDiv.innerHTML;
  });
}

/* ================= CHAT SYSTEM ================= */
window.sendMessage = async () => {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();

  if (!text) return;

  await addDoc(collection(db, "posts"), {
    text,
    user: user.email.split("@")[0],
    time: Date.now()
  });

  input.value = "";
};

/* ================= FEED ================= */
function loadFeed() {
  const q = query(collection(db, "posts"), orderBy("time"));

  onSnapshot(q, (snap) => {
    const box = document.getElementById("chatBox");
    box.innerHTML = "";

    snap.forEach(docSnap => {
      const m = docSnap.data();

      box.innerHTML += `
        <div style="margin:6px 0;">
          <b style="color:#5bc0be;">${m.user}</b>
          <div style="color:#fff;">${m.text}</div>
        </div>
      `;
    });

    box.scrollTop = box.scrollHeight;
  });
}

/* ================= WALLET ================= */
function loadWallet() {
  const walletRef = doc(db, "wallet", "main");

  onSnapshot(walletRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();

      const balanceEl = document.getElementById("walletBalance");
      const updatedEl = document.getElementById("walletUpdated");

      if (balanceEl) balanceEl.innerText = data.balance || 0;

      if (updatedEl) {
        updatedEl.innerText = data.lastUpdated
          ? new Date(data.lastUpdated).toLocaleString()
          : "-";
      }
    }
  });
}

/* ================= CRYPTO PRICES ================= */
async function loadBTCPrice() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,tether&vs_currencies=usd"
    );

    const data = await res.json();

    const btcEl = document.getElementById("btcPrice");

    if (btcEl) {
      btcEl.innerText =
        "BTC: $" + data.bitcoin.usd +
        " | ETH: $" + data.ethereum.usd +
        " | BNB: $" + data.binancecoin.usd +
        " | USDT: $" + data.tether.usd;
    }
  } catch (err) {
    const btcEl = document.getElementById("btcPrice");
    if (btcEl) btcEl.innerText = "Error loading prices";
  }
}

setInterval(loadBTCPrice, 30000);

/* ================= UPGRADE SYSTEM ================= */
const UPGRADE_LINK = "https://nowpayments.io/payment/?iid=5153003613";

window.goPremium = async () => {
  if (!user) return;

  window.open(UPGRADE_LINK, "_blank");

  await setDoc(doc(db, "upgradeRequests", user.uid), {
    uid: user.uid,
    email: user.email,
    status: "pending",
    createdAt: Date.now()
  });

  alert("Upgrade request sent.");
};

/* FIX BUTTON */
window.upgrade = function () {
  window.goPremium();
};

/* ================= MENU ================= */
window.toggleMenu = () => {
  const m = document.getElementById("menu");
  m.style.display = (m.style.display === "block") ? "none" : "block";
};

function closeMenu() {
  const m = document.getElementById("menu");
  if (m) m.style.display = "none";
}

window.goProfile = () => {
  closeMenu();
  location.href = "profile.html";
};

window.goHome = () => {
  closeMenu();
  location.reload();
};

window.goAdmin = () => {
  closeMenu();

  if (!user) return;

  if (user.email !== "nc.maxiboro@gmail.com") {
    alert("❌ Admin panel locked");
  } else {
    location.href = "admin.html";
  }
};

/* ================= LOGOUT ================= */
window.logout = async () => {
  if (user) {
    try {
      await deleteDoc(doc(db, "onlineUsers", user.uid));
    } catch (e) {}
  }

  signOut(auth).then(() => location.href = "index.html");
};