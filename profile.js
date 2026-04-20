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

/* ================= MENU (FIXED STABLE) ================= */
window.toggleMenu = function () {
  const menu = document.getElementById("dropdownMenu");
  if (!menu) return;

  menu.style.display = (menu.style.display === "block") ? "none" : "block";
};

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
};

/* ================= RESET PASSWORD ================= */
window.resetPassword = async () => {
  await sendPasswordResetEmail(auth, user.email);
  alert("Reset email sent");
};

/* ================= CREATE POST ================= */
window.createPost = async () => {
  const input = document.getElementById("postInput");
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

/* ================= LOAD POSTS (V16.3 CLEAN UI FIX) ================= */
function loadPosts() {
  const q = query(collection(db, "posts"), orderBy("time"));

  onSnapshot(q, (snap) => {
    const box = document.getElementById("myPosts");
    box.innerHTML = "";

    snap.forEach(docSnap => {
      const p = docSnap.data();
      const id = docSnap.id;

      if (p.user !== user.email.split("@")[0]) return;

      const isPrivate = p.visibility === "private";

      box.innerHTML += `
        <div class="post">

          <!-- HEADER -->
          <div style="display:flex;justify-content:space-between;align-items:center;">

            <div style="display:flex;align-items:center;">
              <div class="avatar"></div>
              <div style="margin-left:8px;">${p.user}</div>
            </div>

            <!-- DOTS (FIXED) -->
            <div style="position:relative;">
              <div style="cursor:pointer;font-size:20px;"
                   onclick="togglePostMenu('${id}')">⋯</div>

              <div class="menu-box" id="menu-${id}" style="display:none;flex-direction:column;">

                <button onclick="editPost('${id}','${p.text}')">✏️ Edit</button>

                <button onclick="deletePost('${id}')">🗑 Delete</button>

                <button onclick="togglePrivacy('${id}')">
                  ${isPrivate ? "🌍 Make Public" : "🔒 Make Private"}
                </button>

              </div>
            </div>

          </div>

          <!-- CONTENT -->
          <div style="margin-top:8px;">${p.text}</div>

        </div>
      `;
    });
  });
}

/* ================= TOGGLE MENU (FIXED RELIABLE) ================= */
window.togglePostMenu = function (id) {
  const menu = document.getElementById("menu-" + id);
  if (!menu) return;

  const isOpen = menu.style.display === "flex";

  document.querySelectorAll(".menu-box").forEach(m => {
    m.style.display = "none";
  });

  menu.style.display = isOpen ? "none" : "flex";
};

/* ================= EDIT ================= */
window.editPost = async function (id, oldText) {
  const newText = prompt("Edit post:", oldText);
  if (!newText) return;

  await updateDoc(doc(db, "posts", id), {
    text: newText
  });
};

/* ================= DELETE ================= */
window.deletePost = async function (id) {
  if (!confirm("Delete post?")) return;

  await deleteDoc(doc(db, "posts", id));
};

/* ================= TOGGLE PRIVACY (FIXED SAFE VERSION) ================= */
window.togglePrivacy = async function (id) {
  const ref = doc(db, "posts", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const current = snap.data().visibility || "public";
  const newState = current === "private" ? "public" : "private";

  await updateDoc(ref, {
    visibility: newState
  });
};