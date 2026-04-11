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
  arrayUnion
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const ADMIN_EMAIL = "nc.maxiboro@gmail.com";

// ELEMENTS
const postsDiv = document.getElementById("posts");

const totalPostsEl = document.getElementById("totalPosts");
const totalClicksEl = document.getElementById("totalClicks");
const totalLikesEl = document.getElementById("totalLikes");
const topPostEl = document.getElementById("topPost");

// AUTH
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    loadPosts();

    if (user.email === ADMIN_EMAIL) {
      document.getElementById("adminPanel").style.display = "block";
    }
  }
});

// NAVIGATION
window.goHome = function () {
  window.location.reload();
};

window.goProfile = function () {
  alert("Profile page coming soon 👀");
};

// LOGOUT
window.logout = function () {
  signOut(auth);
};

// CREATE POST
window.createPost = async function () {
  const text = document.getElementById("postText").value.trim();
  const link = document.getElementById("postLink").value.trim();

  if (!text || !link) return alert("Fill all fields");

  await addDoc(collection(db, "posts"), {
    text,
    link,
    user: auth.currentUser.email,
    clicks: 0,
    likes: 0,
    comments: [],
    createdAt: new Date()
  });

  document.getElementById("postText").value = "";
  document.getElementById("postLink").value = "";

  loadPosts();
};

// LOAD POSTS + ANALYTICS
async function loadPosts() {
  postsDiv.innerHTML = "Loading...";

  let totalPosts = 0;
  let totalClicks = 0;
  let totalLikes = 0;

  let topPost = { clicks: 0, text: "None" };

  const snapshot = await getDocs(collection(db, "posts"));

  postsDiv.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const post = docSnap.data();
    const id = docSnap.id;

    totalPosts++;
    totalClicks += post.clicks || 0;
    totalLikes += post.likes || 0;

    if ((post.clicks || 0) > topPost.clicks) {
      topPost = { clicks: post.clicks || 0, text: post.text };
    }

    let commentsHTML = "";
    post.comments.forEach(c => {
      commentsHTML += `<p><b>${c.user}:</b> ${c.text}</p>`;
    });

    postsDiv.innerHTML += `
      <div class="post">
        <h4>${post.user}</h4>
        <p>${post.text}</p>

        <a href="${post.link}" target="_blank" onclick="trackClick('${id}')">
          Visit Link
        </a>

        <p>Clicks: ${post.clicks}</p>
        <p>Likes: ${post.likes}</p>

        <button onclick="likePost('${id}')">Like ❤️</button>

        <input id="comment-${id}" placeholder="Comment">
        <button onclick="addComment('${id}')">Send</button>

        ${commentsHTML}
      </div>
    `;
  });

  totalPostsEl.innerText = totalPosts;
  totalClicksEl.innerText = totalClicks;
  totalLikesEl.innerText = totalLikes;
  topPostEl.innerText = topPost.text;
}

// CLICK TRACK
window.trackClick = async function (id) {
  const ref = doc(db, "posts", id);
  await updateDoc(ref, { clicks: increment(1) });
};

// LIKE
window.likePost = async function (id) {
  const ref = doc(db, "posts", id);
  await updateDoc(ref, { likes: increment(1) });
  loadPosts();
};

// COMMENT
window.addComment = async function (id) {
  const input = document.getElementById(`comment-${id}`);
  const text = input.value.trim();

  if (!text) return;

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
