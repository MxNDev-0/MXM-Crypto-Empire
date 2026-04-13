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
const loader = document.getElementById("loader");

let currentUser = null;
let currentUserData = null;

// ================= AUTH (FIXED PROPERLY) =================
onAuthStateChanged(auth, async (user) => {
  loader.style.display = "none";

  if (!user) {
    window.location.replace("index.html");
    return;
  }

  currentUser = user;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,
      premium: false,
      lastPost: 0
    });

    currentUserData = {
      email: user.email,
      premium: false,
      lastPost: 0
    };
  } else {
    currentUserData = snap.data();
  }

  loadPosts();
});

// ================= NAV =================
function goHome() {
  loadPosts();
}

function goProfile() {
  window.location.href = "profile.html";
}

function goAdmin() {
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
    alert("Not admin");
    return;
  }
  document.getElementById("adminPanel").style.display = "block";
}

function support() {
  window.open("https://nowpayments.io/payment/?iid=5153003613");
}

async function logout() {
  await signOut(auth);
  window.location.replace("index.html");
}

// expose to HTML
window.goHome = goHome;
window.goProfile = goProfile;
window.goAdmin = goAdmin;
window.support = support;
window.logout = logout;

// ================= CREATE POST =================
async function createPost() {
  if (!currentUser) return;

  const text = document.getElementById("postText").value;
  const link = document.getElementById("postLink").value;

  if (!text) return alert("Write something");

  const now = Date.now();
  const isAdmin = currentUser.email === ADMIN_EMAIL;

  if (!isAdmin) {
    if (now - currentUserData.lastPost < 86400000) {
      return alert("You can only post once per day");
    }

    if (link) {
      return alert("Links only available in Version 2");
    }
  }

  await addDoc(collection(db, "posts"), {
    text,
    link: isAdmin ? link : "",
    user: currentUser.email,
    time: now
  });

  if (!isAdmin) {
    await updateDoc(doc(db, "users", currentUser.uid), {
      lastPost: now
    });

    currentUserData.lastPost = now;
  }

  document.getElementById("postText").value = "";
  document.getElementById("postLink").value = "";

  loadPosts();
}

window.createPost = createPost;

// ================= LOAD POSTS =================
async function loadPosts() {
  const snapshot = await getDocs(collection(db, "posts"));
  postsDiv.innerHTML = "";

  snapshot.forEach(docSnap => {
    const post = docSnap.data();

    postsDiv.innerHTML += `
      <div class="post">
        <h4>${post.user}</h4>
        <p>${post.text}</p>
        ${post.link ? `<a href="${post.link}" target="_blank">Visit 🔗</a>` : ""}
      </div>
    `;
  });
}