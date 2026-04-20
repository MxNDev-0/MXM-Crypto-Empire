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
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) location.href = "index.html";

  user = u;

  loadPosts();
  loadUsername();
});

/* ================= MENU (FIXED STABLE TOGGLE) ================= */
window.toggleMenu = function () {
  const menu =
    document.getElementById("dropdownMenu") ||
    document.getElementById("menu");

  if (!menu) return;

  const isOpen =
    menu.style.display === "block" ||
    menu.classList.contains("active");

  if (isOpen) {
    menu.style.display = "none";
    menu.classList.remove("active");
  } else {
    menu.style.display = "block";
    menu.classList.add("active");
  }
};

/* ================= USERNAME ================= */
async function loadUsername() {
  if (!user) return;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const display = document.getElementById("usernameDisplay");

  if (snap.exists() && snap.data().username) {
    display.innerText = snap.data().username;
  } else {
    display.innerText = "Not set";
  }
}

/* ================= UPDATE USERNAME ================= */
window.updateUsername = async () => {
  const input = document.getElementById("usernameInput");
  const username = input.value.trim();

  if (!username) return alert("Enter username");

  await setDoc(
    doc(db, "users", user.uid),
    { username },
    { merge: true }
  );

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

/* ================= LOAD POSTS (FIXED FACEBOOK STYLE) ================= */
function loadPosts() {
  const q = query(collection(db, "posts"), orderBy("time"));

  onSnapshot(q, (snap) => {
    const box = document.getElementById("myPosts");
    box.innerHTML = "";

    snap.forEach(docSnap => {
      const p = docSnap.data();
      const id = docSnap.id;

      if (p.user !== user.email.split("@")[0]) return;

      box.innerHTML += `
        <div class="post" style="position:relative;">

          <div class="post-header">
            <div class="avatar"></div>
            <div>${p.user}</div>
          </div>

          <div style="margin-top:6px;">
            ${p.text}
          </div>

          <!-- 3 DOT MENU (FORCED TOP RIGHT ONLY) -->
          <div style="
            position:absolute;
            top:8px;
            right:8px;
            cursor:pointer;
            font-size:20px;
            user-select:none;
          " onclick="togglePostMenu('${id}')">⋯</div>

          <!-- DROPDOWN MENU -->
          <div class="menu-box" id="menu-${id}">
            <button onclick="deletePost('${id}')">Delete</button>
          </div>

        </div>
      `;
    });
  });
}

/* ================= POST MENU TOGGLE (ISOLATED SAFE) ================= */
window.togglePostMenu = (id) => {
  const menu = document.getElementById("menu-" + id);
  if (!menu) return;

  // close others
  document.querySelectorAll(".menu-box").forEach(m => {
    if (m.id !== "menu-" + id) {
      m.style.display = "none";
    }
  });

  menu.style.display =
    menu.style.display === "block" ? "none" : "block";
};

/* ================= DELETE ================= */
window.deletePost = async (id) => {
  await deleteDoc(doc(db, "posts", id));
};