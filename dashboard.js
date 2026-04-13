import { auth, db } from "./firebase.js";

import {
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const ADMIN_EMAIL = "nc.maxiboro@gmail.com";
const postsDiv = document.getElementById("posts");

let currentUserData = null;

// 🔥 AUTH CHECK (NO LOOP)
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    // ⛔ ONLY redirect once after delay
    setTimeout(() => {
      if (!auth.currentUser) {
        window.location.href = "index.html";
      }
    }, 1000);
    return;
  }

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,
      premium: false,
      lastPost: 0
    });
  }

  currentUserData = (await getDoc(ref)).data();

  loadPosts();
});

// LOGOUT
window.logout = async () => {
  await signOut(auth);
  window.location.href = "index.html";
};

// NAV
window.goHome = () => loadPosts();
window.goProfile = () => window.location.href = "profile.html";

// SUPPORT
window.support = () => {
  window.open("https://nowpayments.io/payment/?iid=5153003613");
};

// CREATE POST
window.createPost = async function () {
  const user = auth.currentUser;
  const text = document.getElementById("postText").value;
  const link = document.getElementById("postLink").value;

  if (!text) return alert("Write something");

  const now = Date.now();
  const isAdmin = user.email === ADMIN_EMAIL;

  if (!isAdmin) {
    if (now - currentUserData.lastPost < 86400000) {
      return alert("You can only post once per day");
    }

    if (link) {
      return alert("🔒 Links only available in Version 2");
    }
  }

  await addDoc(collection(db, "posts"), {
    text,
    link: isAdmin ? link : "",
    user: user.email,
    time: now
  });

  if (!isAdmin) {
    await updateDoc(doc(db, "users", user.uid), {
      lastPost: now
    });
  }

  document.getElementById("postText").value = "";
  document.getElementById("postLink").value = "";

  loadPosts();
};

// LOAD POSTS
async function loadPosts() {
  const snapshot = await getDocs(collection(db, "posts"));
  postsDiv.innerHTML = "";

  snapshot.forEach(docSnap => {
    const post = docSnap.data();

    postsDiv.innerHTML += `
      <div class="post">
        <h4>${post.user