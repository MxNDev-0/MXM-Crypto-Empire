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
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;
let userData = null;
let isAdmin = false;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) {
    location.href = "index.html";
    return;
  }

  user = u;

  await ensureUser();
  await loadUser();

  isAdmin = userData?.role === "admin";

  loadChatV10();
  setupPresence();
});

/* ================= USER ================= */
async function ensureUser() {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,
      username: user.email.split("@")[0],
      role: "user"
    });
  }
}

async function loadUser() {
  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists()) userData = snap.data();
}

/* ================= CHAT V10 ENGINE ================= */

const CHAT_PATH = "chats/global/messages";

let lastRenderId = null;

function loadChatV10() {
  const box = document.getElementById("chatBox");
  if (!box) return;

  const q = query(collection(db, CHAT_PATH), orderBy("time", "asc"));

  onSnapshot(q, (snap) => {
    let html = "";

    snap.forEach(d => {
      const m = d.data();

      if (!m?.text) return;

      const id = d.id;
      const userName = m.user || "unknown";

      const time = m.time?.toDate
        ? m.time.toDate().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })
        : "";

      const isMe = userName === user.email.split("@")[0];

      html += `
        <div style="
          display:flex;
          flex-direction:column;
          align-items:${isMe ? "flex-end" : "flex-start"};
          margin:6px 0;
        ">

          <div style="
            max-width:75%;
            padding:8px 10px;
            border-radius:14px;
            background:${isMe ? "#5bc0be" : "#1c2541"};
            color:${isMe ? "#000" : "#fff"};
            font-size:13px;
            word-break:break-word;
          ">
            ${m.text}
          </div>

          <div style="font-size:9px;opacity:0.5;margin-top:2px;">
            ${userName} • ${time}
          </div>

        </div>
      `;
    });

    box.innerHTML = html;
    box.scrollTop = box.scrollHeight;
  });
}

/* ================= SEND MESSAGE (V10 SAFE WRITE ================= */
window.sendMessage = async function () {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();

  if (!text || !user) return;

  input.value = "";

  await addDoc(collection(db, CHAT_PATH), {
    text,
    user: user.email.split("@")[0],
    uid: user.uid,
    time: serverTimestamp(),
    status: "sent"
  });
};

/* ================= PRESENCE ================= */
function setupPresence() {
  const ref = doc(db, "presence", user.uid);

  setDoc(ref, {
    uid: user.uid,
    username: user.email.split("@")[0],
    online: true,
    lastSeen: serverTimestamp()
  });

  window.addEventListener("beforeunload", async () => {
    await setDoc(ref, {
      uid: user.uid,
      online: false,
      lastSeen: serverTimestamp()
    }, { merge: true });
  });
}

/* ================= NAV ================= */
window.logout = async function () {
  await signOut(auth);
  location.href = "index.html";
};

window.toggleMenu = function () {
  document.getElementById("menu").classList.toggle("active");
};

window.goHome = () => location.href = "dashboard.html";
window.goProfile = () => location.href = "profile.html";
window.goAdSpace = () => location.href = "ads.html";
window.goAdmin = () => location.href = "admin.html";