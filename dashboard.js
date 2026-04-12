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
  increment,
  arrayUnion,
  setDoc,
  getDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const ADMIN_EMAIL = "nc.maxiboro@gmail.com";
const BACKEND_URL = "https://mxm-backend.onrender.com";

const postsDiv = document.getElementById("posts");

// ================= AUTH =================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      email: user.email,
      premium: false
    });
  }

  loadPosts();
});

// ================= NAV =================
window.logout = () => signOut(auth);
window.goHome = () => loadPosts();
window.goProfile = () => alert("Profile coming soon");

// ================= PREMIUM =================
window.goPremium = async function () {
  try {
    const user = auth.currentUser;

    if (!user) return alert("Login first");

    alert("Creating payment...");

    const res = await fetch(`${BACKEND_URL}/create-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: user.uid
      })
    });

    const data = await res.json();

    if (!data.payment_url) {
      alert("Payment failed ❌");
      return;
    }

    window.location.href = data.payment_url;

  } catch (err) {
    console.error(err);
    alert("Error connecting to server ❌");
  }
};

// ================= ADMIN =================
window.goAdmin = async function () {
  if (auth.currentUser.email !== ADMIN_EMAIL) {
    alert("Not admin ❌");
    return;
  }

  document.getElementById("adminPanel").style.display = "block";
  loadUsers();
};

// ================= SEND NOTIFICATION =================
window.sendNotification = async function () {
  const message = prompt("Enter notification message:");

  if (!message) return;

  await addDoc(collection(db, "notifications"), {
    message: message,
    time: Date.now()
  });

  alert("Notification sent ✅");
};

// ================= REALTIME NOTIFICATIONS =================
onSnapshot(collection(db, "notifications"), (snapshot) => {
  snapshot.docChanges().forEach(change => {
    if (change.type === "added") {
      const data = change.doc.data();
      alert("🔔 " + data.message);
    }
  });
});

// ================= CREATE POST =================
window.createPost = async function () {
  const text = document.getElementById("postText").value;
  const link = document.getElementById("postLink").value;

  if (!text || !link) return alert("Fill all fields");

  await addDoc(collection(db, "posts"), {
    text,
    link,
    user: auth.currentUser.email,
    clicks: 0,
    likes: 0,
    comments: [],
    premium: false
  });

  loadPosts();
};

// ================= LOAD POSTS =================
async function loadPosts() {
  postsDiv.innerHTML = "Loading...";

  const userRef = doc(db, "users", auth.currentUser.uid);
  const userSnap = await getDoc(userRef);

  const isPremium = userSnap.data()?.premium;

  const snapshot = await getDocs(collection(db, "posts"));

  postsDiv.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const post = docSnap.data();
    const id = docSnap.id;

    const locked = post.premium && !isPremium;

    postsDiv.innerHTML += `
      <div class="post">
        <h4>${post.user} ${post.premium ? "💎" : ""}</h4>

        <p class="${locked ? "locked" : ""}">
          ${post.text}
        </p>

        ${locked ? `
          <button class="unlock-btn" onclick="goPremium()">
            Unlock Premium 💎
          </button>
        ` : `
          <a href="${post.link}" target="_blank" onclick="trackClick('${id}')">
            Visit Link
          </a>
        `}

        <p>Clicks: ${post.clicks}</p>
        <p>Likes: ${post.likes}</p>

        <button onclick="likePost('${id}')">Like ❤️</button>

        <input id="comment-${id}" placeholder="Comment">
        <button onclick="addComment('${id}')">Send</button>
      </div>
    `;
  });
}

// ================= ACTIONS =================
window.trackClick = async (id) => {
  const ref = doc(db, "posts", id);
  await updateDoc(ref, { clicks: increment(1) });
};

window.likePost = async (id) => {
  const ref = doc(db, "posts", id);
  await updateDoc(ref, { likes: increment(1) });
  loadPosts();
};

window.addComment = async (id) => {
  const input = document.getElementById(`comment-${id}`);
  const text = input.value;

  const ref = doc(db, "posts", id);

  await updateDoc(ref, {
    comments: arrayUnion({
      user: auth.currentUser.email,
      text
    })
  });

  input.value = "";
  loadPosts();
};

// ================= ADMIN USERS =================
async function loadUsers() {
  const usersList = document.getElementById("usersList");
  usersList.innerHTML = "";

  const snapshot = await getDocs(collection(db, "users"));

  snapshot.forEach((docSnap) => {
    const user = docSnap.data();
    const id = docSnap.id;

    usersList.innerHTML += `
      <div class="user-card">
        <p>${user.email}</p>
        <p>Premium: ${user.premium}</p>

        <button onclick="togglePremium('${id}', ${user.premium})">
          Toggle Premium
        </button>
      </div>
    `;
  });
}

window.togglePremium = async function (id, status) {
  const ref = doc(db, "users", id);

  await updateDoc(ref, {
    premium: !status
  });

  loadUsers();
};
