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
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) location.href = "index.html";

  user = u;

  loadPosts();
  loadUsername();
});

/* ================= MENU ================= */
window.toggleMenu = function () {
  const menu =
    document.getElementById("dropdownMenu") ||
    document.getElementById("menu");

  if (!menu) return;

  menu.classList.toggle("active");
  menu.style.display = menu.classList.contains("active") ? "block" : "none";
};

/* ================= USERNAME ================= */
async function loadUsername() {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const display = document.getElementById("usernameDisplay");

  display.innerText =
    snap.exists() && snap.data().username
      ? snap.data().username
      : "Not set";
}

window.updateUsername = async () => {
  const input = document.getElementById("usernameInput");
  const username = input.value.trim();

  if (!username) return alert("Enter username");

  await setDoc(doc(db, "users", user.uid), { username }, { merge: true });

  document.getElementById("usernameDisplay").innerText = username;
  input.value = "";
};

/* ================= RESET PASSWORD ================= */
window.resetPassword = async () => {
  if (!user?.email) return;

  await sendPasswordResetEmail(auth, user.email);
  alert("Reset email sent 📩");
};

/* ================= CREATE POST ================= */
window.createPost = async () => {
  const input = document.getElementById("postInput");
  const text = input.value.trim();

  if (!text) return;

  await addDoc(collection(db, "posts"), {
    text,
    user: user.email.split("@")[0],
    time: Date.now()
  });

  input.value = "";
};

/* ================= LOAD POSTS (CLEAN + NO BUTTONS BUG) ================= */
function loadPosts() {
  const q = query(collection(db, "posts"), orderBy("time"));

  onSnapshot(q, (snap) => {
    const box = document.getElementById("myPosts");
    box.innerHTML = "";

    snap.forEach(docSnap => {
      const p = docSnap.data();

      if (p.user !== user.email.split("@")[0]) return;

      const id = docSnap.id;

      box.innerHTML += `
        <div class="post">

          <div class="post-header">
            <div class="avatar"></div>
            <div>${p.user}</div>
          </div>

          <div>${p.text}</div>

          <!-- ONLY ONE CLEAN 3 DOT MENU PER POST -->
          <div class="dots" onclick="togglePostMenu('${id}')">⋯</div>

          <div class="menu-box" id="menu-${id}">
            <button onclick="deletePost('${id}')">Delete</button>
          </div>

        </div>
      `;
    });
  });
}

/* ================= 3 DOT MENU FIX ================= */
window.togglePostMenu = (id) => {
  const el = document.getElementById("menu-" + id);
  if (!el) return;

  document.querySelectorAll(".menu-box").forEach(m => {
    if (m.id !== "menu-" + id) m.style.display = "none";
  });

  el.style.display = el.style.display === "flex" ? "none" : "flex";
};

/* ================= DELETE ONLY (NO VISIBILITY SYSTEM ANYMORE) ================= */
window.deletePost = async (id) => {
  await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js")
    .then(m => m.deleteDoc(doc(db, "posts", id)));
};