import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  addDoc,
  collection,
  onSnapshot,
  deleteDoc,
  query,
  orderBy,
  getDocs,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= MONITOR ================= */
function log(msg) {
  const box = document.getElementById("monitor");
  if (!box) return;

  const time = new Date().toLocaleTimeString();

  const line = document.createElement("div");
  line.textContent = `[${time}] ${msg}`;

  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

/* ================= STATE ================= */
window.selectedUser = null;
window.replyTarget = null;

/* ================= BOOT ================= */
window.addEventListener("DOMContentLoaded", () => {
  const box = document.getElementById("monitor");
  if (box) box.innerHTML = "🟢 Admin booting...";

  setTimeout(() => {
    log("System ready");
  }, 500);
});

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "index.html";

  const snap = await getDoc(doc(db, "users", user.uid));
  const role = snap.exists() ? snap.data().role : "user";

  if (role !== "admin") {
    alert("Access denied");
    location.href = "dashboard.html";
    return;
  }

  log("Admin logged in");
  startSystem();
});

/* ================= SYSTEM ================= */
function startSystem() {
  loadUsers();
  loadPosts();
  loadAdRequests();
  loadChatMonitor();
}

/* ================= CHAT MONITOR (UPGRADED) ================= */
function loadChatMonitor() {
  const box = document.getElementById("monitor");
  if (!box) return;

  onSnapshot(collection(db, "chats"), (snap) => {
    snap.docChanges().forEach(change => {
      if (change.type === "added") {
        const m = change.doc.data();

        const line = document.createElement("div");
        line.style.padding = "6px";
        line.style.borderBottom = "1px solid #222";
        line.style.cursor = "pointer";

        line.innerHTML = `
          💬 
          <b style="color:#5bc0be;cursor:pointer"
             onclick="openUser('${m.uid}','${m.username}')">
            ${m.username}
          </b>: ${m.text}
          
          <span style="float:right;color:orange;cursor:pointer"
                onclick="replyTo('${change.doc.id}','${m.username}')">
            ↩
          </span>
        `;

        box.appendChild(line);
        box.scrollTop = box.scrollHeight;
      }
    });
  });
}

/* ================= USER POPUP ================= */
window.openUser = (uid, name) => {
  window.selectedUser = { uid, name };

  let popup = document.getElementById("userPopup");

  if (!popup) {
    popup = document.createElement("div");
    popup.id = "userPopup";
    popup.style = `
      position:fixed;
      top:20%;
      left:50%;
      transform:translateX(-50%);
      background:#1c2541;
      padding:15px;
      border-radius:10px;
      width:280px;
      z-index:99999;
      color:white;
    `;

    popup.innerHTML = `
      <h3 id="popupName"></h3>
      <button onclick="startDM()">💬 DM User</button>
      <button onclick="addFriend()">➕ Add Friend</button>
      <button onclick="closePopup()">❌ Close</button>
    `;

    document.body.appendChild(popup);
  }

  document.getElementById("popupName").innerText = name;
  popup.style.display = "block";
};

window.closePopup = () => {
  const popup = document.getElementById("userPopup");
  if (popup) popup.style.display = "none";
};

window.startDM = () => {
  if (!window.selectedUser) return;

  localStorage.setItem("dmTarget", JSON.stringify(window.selectedUser));

  location.href = "messages.html";
};

window.addFriend = () => {
  alert("Friend system coming next phase");
};

/* ================= REPLY SYSTEM ================= */
window.replyTo = (msgId, username) => {
  window.replyTarget = { msgId, username };
  log("Replying to: " + username);
};

/* ================= BROADCAST ================= */
window.sendBroadcast = async () => {
  const title = document.getElementById("broadcastTitle");
  const message = document.getElementById("broadcastMessage");

  if (!title.value || !message.value) {
    log("Fill fields");
    return;
  }

  await addDoc(collection(db, "broadcasts"), {
    title: title.value,
    message: message.value,
    createdAt: Date.now(),
    active: true
  });

  log("Broadcast sent");

  title.value = "";
  message.value = "";
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
        <div class="item" onclick="openUser('${d.id}','${u.email}')">
          ${u.email}
        </div>
      `;
    });
  });
}

/* ================= POSTS ================= */
function loadPosts() {
  const box = document.getElementById("postsList");
  if (!box) return;

  onSnapshot(query(collection(db, "posts"), orderBy("time")), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      box.innerHTML += `
        <div class="item">
          ${d.data().text}
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

/* ================= AD REQUESTS ================= */
function loadAdRequests() {
  const box = document.getElementById("upgradeList");
  if (!box) return;

  onSnapshot(collection(db, "adRequests"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      box.innerHTML += `
        <div class="item">
          ${d.data().title}
        </div>
      `;
    });
  });
}