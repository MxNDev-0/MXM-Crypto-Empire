import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "./firebase.js";

// 🔥 auto redirect if already logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "dashboard.html";
  }
});

window.addEventListener("DOMContentLoaded", () => {

  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");

  // LOGIN
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("pass").value;

    if (!email || !pass) {
      alert("Fill all fields");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      alert("Login successful");
      window.location.href = "dashboard.html";
    } catch (e) {
      alert("Login failed: " + e.message);
    }
  });

  // SIGNUP
  signupBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("pass").value;

    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      alert("Account created! Now login.");
    } catch (e) {
      alert(e.message);
    }
  });

});
