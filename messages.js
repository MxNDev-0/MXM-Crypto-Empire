import { auth, db } from "./firebase.js";

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let me = null;
let otherUid = new URLSearchParams(location.search).get("uid");

/* ================= AUTH ================= */
onAuthStateChanged(auth, (u) => {
  if (!u) location.href = "index.html";

  me = u;

  loadMessages();
});

/* ================= CHAT ID ================= */
function chatId(a, b) {
  return [a, b].sort().join("_");
}

/* ================= LOAD ================= */
function loadMessages() {
  const id = chatId(me.uid, otherUid);

  const q = query(
    collection(db, "messages", id, "messages"),
    orderBy("time")
  );

  onSnapshot(q, (snap) => {
    const box = document.getElementById("chat");
    box.innerHTML = "";

    snap.forEach(d => {
      const m = d.data();

      box.innerHTML += `
        <div class="msg">
          <b>${m.sender === me.uid ? "You" : "User"}</b><br>
          ${m.text}
        </div>
      `;
    });
  });
}

/* ================= SEND ================= */
window.sendMsg = async function () {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text) return;

  const id = chatId(me.uid, otherUid);

  await addDoc(collection(db, "messages", id, "messages"), {
    text,
    sender: me.uid,
    time: serverTimestamp()
  });

  /* 🔔 notification */
  await addDoc(collection(db, "notifications", otherUid, "items"), {
    text: "New message received",
    seen: false,
    createdAt: serverTimestamp()
  });

  input.value = "";
};

window.sendFriendRequest = async function (toUid, toName) {
  await addDoc(collection(db, "friendRequests"), {
    from: user.uid,
    fromName: user.email.split("@")[0],
    to: toUid,
    toName,
    status: "pending",
    createdAt: serverTimestamp()
  });

  /* notification */
  await addDoc(collection(db, "notifications", toUid, "items"), {
    text: `${user.email.split("@")[0]} sent you a friend request`,
    seen: false,
    createdAt: serverTimestamp()
  });
};