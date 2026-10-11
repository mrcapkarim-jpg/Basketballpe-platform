
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB8I35Hxg2soHhUQMoAbCfbP7BNs05Fwq0",
  authDomain: "karim-basketball-platform.firebaseapp.com",
  projectId: "karim-basketball-platform",
  storageBucket: "karim-basketball-platform.firebasestorage.app",
  messagingSenderId: "453716289474",
  appId: "1:453716289474:web:6a847f171b62d338f2185b",
  measurementId: "G-RML2C9E25X"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.registerWithFirebase = async function(studentId, password) {
  const email = `${studentId}@karimbasketball.local`;
  return createUserWithEmailAndPassword(auth, email, password);
};

window.loginWithFirebase = async function(studentId, password) {
  const email = `${studentId}@karimbasketball.local`;
  return signInWithEmailAndPassword(auth, email, password);
};

