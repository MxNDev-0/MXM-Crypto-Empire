import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;

/* ================= MONITOR LOG ================= */
function log(msg) {
  const box = document.getElementById("monitor");
  if (!box) return;

  const time = new Date().toLocaleTimeString();
  box.innerHTML += `<br>[${time}] ${msg}`;
  box.scrollTop = box.scrollHeight;
}

/* ================= CHAT UI TOGGLE ================= */
window.toggleChatInput = function () {
  const box = document.getElementById("chatInputBox");
  if (!box) return;

  box.style.display = box.style.display === "block" ? "none" : "block";
};

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) location.href = "index.html";

  user = u;

  log("Profile system online");

  loadUsername();
  loadFriendRequests();
  loadFriends();
  loadChat(); // 🔥 CHAT ENABLED IN PROFILE MONITOR
  loadNotifications();
  monitorAdRequests();
});

/* ================= USERNAME ================= */
async function loadUsername() {
  const snap = await getDoc(doc(db, "users", user.uid));
  const el = document.getElementById("usernameDisplay");

  if (snap.exists() && snap.data().username) {
    el.innerText = snap.data().username;
  } else {
    el.innerText = "Not set";
  }
}

/* ================= UPDATE USERNAME ================= */
window.updateUsername = async () => {
  const input = document.getElementById("usernameInput");
  const username = input.value.trim();

  if (!username) return alert("Enter username");

  await setDoc(doc(db, "users", user.uid), { username }, { merge: true });

  document.getElementById("usernameDisplay").innerText = username;
  input.value = "";

  log("Username updated");
};

/* ================= RESET PASSWORD ================= */
window.resetPassword = async () => {
  await sendPasswordResetEmail(auth, user.email);
  alert("Reset email sent");

  log("Password reset email sent");
};

/* ================= 🔥 CHAT SYSTEM (PROFILE MONITOR MERGED) ================= */
window.sendChat = async () => {
  const input = document.getElementById("chatInput");

  if (!input || !input.value.trim()) return;

  await addDoc(collection(db, "chats"), {
    text: input.value,
    uid: user.uid,
    username: user.email.split("@")[0],
    createdAt: serverTimestamp()
  });

  log("You: " + input.value);
  input.value = "";
};

function loadChat() {
  const box = document.getElementById("monitor");
  if (!box) return;

  onSnapshot(collection(db, "chats"), (snap) => {
    snap.docChanges().forEach(change => {
      if (change.type === "added") {
        const m = change.doc.data();

        const line = document.createElement("div");
        line.innerHTML = `💬 <b>${m.username}</b>: ${m.text}`;

        box.appendChild(line);
        box.scrollTop = box.scrollHeight;
      }
    });
  });
}

/* ================= NOTIFICATIONS ================= */
function loadNotifications() {
  const ref = collection(db, "notifications", user.uid, "items");

  onSnapshot(query(ref, orderBy("createdAt", "desc")), (snap) => {
    snap.docChanges().forEach(change => {
      if (change.type === "added") {
        const data = change.doc.data();
        log(data.text || "New notification");
      }
    });
  });
}

/* ================= AD REQUEST MONITOR ================= */
function monitorAdRequests() {
  const q = query(
    collection(db, "adRequests"),
    where("userId", "==", user.uid)
  );

  onSnapshot(q, (snap) => {
    let active = "No active ads";

    snap.forEach(d => {
      const ad = d.data();

      if (ad.status === "approved") {
        active = "Active";
        log("Ad approved");
      }

      if (ad.status === "rejected") {
        log("Ad rejected");
      }

      if (ad.status === "pending") {
        log("Ad pending");
      }
    });

    const el = document.getElementById("adStatus");
    if (el) el.innerText = active;
  });
}

/* ================= FRIEND SYSTEM (UNCHANGED) ================= */
window.sendFriendRequest = async function (toUid, toName) {
  if (!user || user.uid === toUid) return;

  await addDoc(collection(db, "friendRequests"), {
    from: user.uid,
    fromName: user.email.split("@")[0],
    to: toUid,
    toName,
    status: "pending",
    createdAt: serverTimestamp()
  });

  await addDoc(collection(db, "notifications", toUid, "items"), {
    text: `${user.email.split("@")[0]} sent a friend request`,
    seen: false,
    createdAt: serverTimestamp()
  });

  log("Friend request sent");
};

/* ================= FRIEND REQUESTS ================= */
function loadFriendRequests() {
  const box = document.getElementById("friendRequestsBox");
  if (!box) return;

  const q = query(
    collection(db, "friendRequests"),
    where("to", "==", user.uid),
    where("status", "==", "pending")
  );

  onSnapshot(q, (snap) => {
    let html = "";

    snap.forEach(d => {
      const r = d.data();

      html += `
        <div class="card">
          <b>${r.fromName}</b> sent a request
        </div>
      `;
    });

    box.innerHTML = html;
  });
}

/* ================= FRIEND LIST ================= */
function loadFriends() {
  const box = document.getElementById("friendsBox");
  if (!box) return;

  onSnapshot(collection(db, "friends"), (snap) => {
    let html = "";

    snap.forEach(d => {
      const f = d.data();

      if (f.userA !== user.uid && f.userB !== user.uid) return;

      const friendId = f.userA === user.uid ? f.userB : f.userA;

      html += `
        <div class="card">
          👤 ${friendId}
        </div>
      `;
    });

    box.innerHTML = html;
  });
}

/* ================= NAV ================= */
window.openProfile = function (uid) {
  location.href = `user.html?uid=${uid}`;
};