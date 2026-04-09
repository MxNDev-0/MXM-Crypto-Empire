function signup() {
  createUserWithEmailAndPassword(
    auth,
    email.value,
    password.value
  )
  .then(() => alert("Account created successfully"))
  .catch(err => alert(err.message));
}

function login() {
  signInWithEmailAndPassword(
    auth,
    email.value,
    password.value
  )
  .then(() => alert("Login successful"))
  .catch(err => alert(err.message));
}
