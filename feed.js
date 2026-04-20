import { auth, db } from "./firebase.js";

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let me = null;

onAuthStateChanged(auth, (u) => {
  if (!u) location.href = "index.html";

  me = u;

  loadFeed();
});

/* ================= FEED ================= */
function loadFeed() {
  const q = query(collection(db, "posts"), orderBy("time", "desc"));

  onSnapshot(q, async (snap) => {
    const box = document.getElementById("feed");
    box.innerHTML = "";

    for (const d of snap.docs) {
      const p = d.data();
      const id = d.id;

      box.innerHTML += `
        <div class="post">

          <div class="top">
            <div class="user">
              <div class="avatar"></div>
              <b>${p.user}</b>
            </div>

            <button onclick="openProfile('${p.userId}')">View</button>
          </div>

          <div style="margin-top:8px;">
            ${p.text}
          </div>

          <div style="margin-top:8px;">
            <button onclick="likePost('${id}')">👍 Like</button>
          </div>

        </div>
      `;
    }
  });
}

/* ================= LIKE SYSTEM ================= */
window.likePost = async function (id) {
  const ref = doc(db, "posts", id);

  const snap = await getDoc(ref);
  const data = snap.data();

  const likes = data.likes || [];

  const uid = me.uid;

  const updated = likes.includes(uid)
    ? likes.filter(x => x !== uid)
    : [...likes, uid];

  await updateDoc(ref, { likes: updated });
};

/* ================= PROFILE REDIRECT ================= */
window.openProfile = function (userId) {
  location.href = `user.html?uid=${userId}`;
};