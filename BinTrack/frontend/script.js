import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCzi2IsDsZE5WIA7KpDgS-0RFs6vxSDqDY",
  authDomain: "brave-design-417105.firebaseapp.com",
  databaseURL: "https://brave-design-417105-default-rtdb.firebaseio.com",
  projectId: "brave-design-417105",
  storageBucket: "brave-design-417105.appspot.com",
  messagingSenderId: "218139478751",
  appId: "1:218139478751:web:a8a36aeab810976906b76a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 🔁 Listening to "dustbins/001/filled"
const dustbinRef = ref(db, "dustbins/001/filled");

onValue(dustbinRef, (snapshot) => {
  const filled = snapshot.val();
  const statusElement = document.getElementById("dustbin-status-001");

  console.log("Realtime DB value:", filled); // ✅ Debugging log

  if (filled) {
    statusElement.textContent = "✅ Filled";
    statusElement.className = "status filled";
  } else {
    statusElement.textContent = "❌ Not Filled";
    statusElement.className = "status not-filled";
  }
});


