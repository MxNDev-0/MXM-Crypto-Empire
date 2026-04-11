import { auth, db } from "./firebase.js";
import {
  addDoc,
  collection,
  onSnapshot,
  query
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// LOAD MESSAGES LIVE
const chatBox = document.getElementById("chatBox");

const q = query(collection(db, "chats"));

onSnapshot(q, (snapshot) => {
  chatBox.innerHTML = "";

  snapshot.forEach(doc => {
    const m = doc.data();

    chatBox.innerHTML += `
      <div class="msg">
        <b>${m.user}</b>: ${m.text}
      </div>
    `;
  });
});

// SEND MESSAGE
window.sendMsg = async function () {
  const text = document.getElementById("msg").value;

  if (!text) return;

  await addDoc(collection(db, "chats"), {
    text,
    user: auth.currentUser.email,
    time: Date.now()
  });

  document.getElementById("msg").value = "";
};
