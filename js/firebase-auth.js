
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

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
const db = getFirestore(app);

// إنشاء حساب الطالب وحفظ بياناته
window.registerWithFirebase = async function(
  studentId,
  password,
  name,
  className,
  studentSection
) {
  const email = `${studentId}@karimbasketball.com`;

  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  await setDoc(doc(db, "students", credential.user.uid), {
    studentId,
    name,
    className,
    studentSection
  });

  return credential;
};

// تسجيل الدخول واسترجاع بيانات الطالب
window.loginWithFirebase = async function(studentId, password) {
  const email = `${studentId}@karimbasketball.com`;

  const credential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  const snapshot = await getDoc(
    doc(db, "students", credential.user.uid)
  );

  if (!snapshot.exists()) {
    throw new Error("STUDENT_PROFILE_NOT_FOUND");
  }

  return {
    user: credential.user,
    student: snapshot.data()
  };
};

window.checkQuizAttempt = async function() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("NOT_LOGGED_IN");
  }

  const attemptRef = doc(db, "quizAttempts", user.uid);
  const snapshot = await getDoc(attemptRef);

  return snapshot.exists();
};

window.saveQuizAttempt = async function(score, total) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("NOT_LOGGED_IN");
  }

  const attemptRef = doc(db, "quizAttempts", user.uid);

  await setDoc(attemptRef, {
    completed: true,
    score: score,
    total: total
  });
};
