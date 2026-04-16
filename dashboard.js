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
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) {
    location.href = "index.html";
    return;
  }

  user = u;

  loadFeed();
  loadWallet();
  loadCryptoPrices();
});

/* ================= FEED ================= */
function loadFeed() {
  const q = query(collection(db, "posts"), orderBy("time"));

  onSnapshot(q, (snap) => {
    const box = document.getElementById("chatBox");
    if (!box) return;

    box.innerHTML = "";

    snap.forEach(docSnap => {
      const m = docSnap.data();

      const visibility = m.visibility ?? "public";
      if (visibility === "private") return;

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

/* ================= SEND MESSAGE ================= */
window.sendMessage = async () => {
  const input = document.getElementById("chatInput");
  if (!input || !user) return;

  const text = input.value.trim();
  if (!text) return;

  await addDoc(collection(db, "posts"), {
    text,
    user: user.email.split("@")[0],
    visibility: "public",
    time: Date.now()
  });

  input.value = "";
};

/* ================= WALLET ================= */
function loadWallet() {
  const walletRef = doc(db, "wallet", "main");

  onSnapshot(walletRef, (snap) => {
    if (!snap.exists()) return;

    const data = snap.data();

    const balanceEl = document.getElementById("walletBalance");
    const updatedEl = document.getElementById("walletUpdated");

    if (balanceEl) balanceEl.innerText = data.balance ?? 0;

    if (updatedEl) {
      updatedEl.innerText = data.lastUpdated
        ? new Date(data.lastUpdated).toLocaleString()
        : "-";
    }
  });
}

/* ================= CRYPTO PRICES ================= */
async function loadCryptoPrices() {
  const el = document.getElementById("btcPrice");
  if (!el) return;

  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,tether&vs_currencies=usd"
    );

    const data = await res.json();

    el.innerText =
      "BTC: $" + (data.bitcoin?.usd ?? 0) +
      " | ETH: $" + (data.ethereum?.usd ?? 0) +
      " | BNB: $" + (data.binancecoin?.usd ?? 0) +
      " | USDT: $" + (data.tether?.usd ?? 0);

  } catch (err) {
    el.innerText = "Crypto unavailable";
  }
}

setInterval(loadCryptoPrices, 30000);

/* ================= UPGRADE SYSTEM (FULL DEBUG FIX) ================= */
async function handleUpgrade() {
  try {
    if (!user) {
      alert("Login required");
      return;
    }

    console.log("UPGRADE CLICKED");

    const token = await user.getIdToken();

    const response = await fetch("https://mxm-backend.onrender.com/create-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      }
    });

    const data = await response.json();

    console.log("STATUS:", response.status);
    console.log("RESPONSE:", data);

    if (!response.ok) {
      alert("ERROR: " + JSON.stringify(data));
      return;
    }

    if (data.payment_url) {
      window.location.href = data.payment_url;
    } else {
      alert("No payment URL returned: " + JSON.stringify(data));
    }

  } catch (err) {
    console.error("UPGRADE ERROR:", err);
    alert("Something went wrong: " + err.message);
  }
}

window.goPremium = handleUpgrade;
window.upgrade = handleUpgrade;

/* ================= MENU ================= */
window.toggleMenu = () => {
  const m = document.getElementById("menu");
  if (m) m.style.display = m.style.display === "block" ? "none" : "block";
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
    alert("❌ Admin locked");
  } else {
    location.href = "admin.html";
  }
};

/* ================= LOGOUT ================= */
window.logout = async () => {
  await signOut(auth);
  location.href = "index.html";
};