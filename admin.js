import { db } from "./firebase.js";

import {
  doc,
  setDoc,
  addDoc,
  collection
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* UPDATE WALLET */
window.updateWallet = async () => {
  const balance = document.getElementById("balanceInput").value;

  await setDoc(doc(db, "wallet", "main"), {
    balance: Number(balance),
    updatedAt: Date.now()
  });

  alert("Wallet updated!");
};

/* ADD EARNING LOG */
window.addEarning = async () => {
  const source = document.getElementById("source").value;
  const amount = document.getElementById("amount").value;

  await addDoc(collection(db, "earningsLog"), {
    source,
    amount: Number(amount),
    date: Date.now()
  });

  alert("Earning added!");
};