const pages=[...document.querySelectorAll(".page")];

function updateStudentGenderPortrait() {
  const portrait = document.getElementById("studentGenderPortrait");
  if (!portrait) return;

  const gender = localStorage.getItem("basketballStudentGender");
  portrait.src = gender === "girl"
    ? "images/student-girl.png"
    : "images/student-boy.png";

  portrait.alt = gender === "girl"
    ? "صورة الطالبة"
    : "صورة الطالب";
}

document.addEventListener("DOMContentLoaded", updateStudentGenderPortrait);

const toast=document.getElementById("toast");let toastTimer;
function notify(message){toast.textContent=message;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),2600)}
function showPage(id){pages.forEach(page=>page.classList.toggle("active",page.id===id));window.scrollTo({top:0,behavior:"smooth"})}
setTimeout(()=>{if(document.getElementById("splashPage").classList.contains("active"))showPage("loginPage")},1800);
document.getElementById("showExistingLogin").addEventListener("click", () => {
  document.getElementById("loginForm").hidden = true;
  document.getElementById("existingLoginBox").hidden = false;
});

const openStudentProfileBtn = document.getElementById("openStudentProfile");

if (openStudentProfileBtn) {
  openStudentProfileBtn.addEventListener("click", () => {
    const name =
      localStorage.getItem("basketballStudentName") || "الطالب";

    const className =
      localStorage.getItem("basketballClassName") || "الصف الدراسي";

    const section =
      localStorage.getItem("basketballStudentSection") || "";

    const profileName = document.getElementById("profileStudentName");
    const profileClass = document.getElementById("profileStudentClass");
    const sectionLabel = document.getElementById("profileSectionLabel");

    if (profileName) profileName.textContent = name;

    if (profileClass) {
      profileClass.textContent = section
        ? className + " — فصل " + section
        : className;
    }

    if (sectionLabel) {
      sectionLabel.textContent = section || "فصلي";
    }

    showPage("studentProfilePage");
    loadStudentLeaderboards();
  });
}

document.getElementById("backToRegister").addEventListener("click", () => {
  document.getElementById("existingLoginBox").hidden = true;
  document.getElementById("loginForm").hidden = false;
});


async function showWelcomeWithRobotTransition() {
  const loginPage = document.getElementById("loginPage");

  loginPage.classList.add("robot-transition-out");

  await new Promise(resolve => setTimeout(resolve, 1300));

  showPage("welcomePage");
  loginPage.classList.remove("robot-transition-out");
}

document.getElementById("existingLoginForm").addEventListener("submit", async event => {
  event.preventDefault();

  const id = document.getElementById("existingStudentId").value.trim();
  const password = document.getElementById("existingStudentPassword").value;

  if (!id || !password) {
    notify("اكتب الرقم القومي وكلمة المرور.");
    return;
  }

  try {
    if (typeof window.loginWithFirebase !== "function") {
      notify("نظام تسجيل الدخول لم يتم تحميله.");
      return;
    }

const result = await window.loginWithFirebase(id, password);
const student = result.student;

localStorage.setItem("basketballStudentId", student.studentId);
localStorage.setItem("basketballStudentName", student.name);
localStorage.setItem("basketballClassName", student.className);
localStorage.setItem("basketballStudentSection", student.studentSection);
localStorage.setItem("basketballStudentGender", student.studentGender || "");

await restoreSavedLearningProgress();
document.getElementById("studentName").textContent = student.name;
document.getElementById("studentClass").textContent = "الصف " + student.className;

await showWelcomeWithRobotTransition();

notify("تم التحقق من الحساب بنجاح.");

  } catch (error) {
    console.error("Login error:", error);
    notify("الرقم القومي أو كلمة المرور غير صحيحة.");
  }
});
document.getElementById("loginForm").addEventListener("submit", async event => {
  event.preventDefault();

  const id = document.getElementById("studentId").value.trim();
  const name = document.getElementById("studentNameInput").value.trim();
  const studentGender = document.getElementById("studentGenderInput").value;
  const className = document.getElementById("classNameInput").value;
  const studentSection = document.getElementById("studentSectionInput").value.trim();
  const password = document.getElementById("studentPasswordInput").value;
  const confirmPassword = document.getElementById("confirmStudentPassword").value;

if (password !== confirmPassword) {
  notify("كلمتا المرور غير متطابقتين. تأكد من كتابتهما بشكل صحيح.");
  document.getElementById("confirmStudentPassword").focus();
  return;
}
  if (id.length < 6) {
    notify("اكتب رقمًا تجريبيًا من 6 أرقام على الأقل.");
    return;
  }

  if (!name || !studentGender || !className || !studentSection) {
  notify("اكتب اسم الطالب واختر النوع والصف واكتب الفصل.");
  return;
}
  if (password.length < 8) {
  notify("كلمة المرور لازم تكون 8 أحرف أو أرقام على الأقل.");
  return;
  }
  try {
    notify("جاري التحقق من التسجيل السابق...");

    const isDuplicate = await checkStudentDuplicate(id);

    if (isDuplicate) {
      notify("الرقم ده مسجّل قبل كده! استخدم بيانات التسجيل السابقة.");
      return;
    }
if (typeof window.registerWithFirebase !== "function") {
  notify("نظام تسجيل الحسابات لم يتم تحميله. حدّث الصفحة وحاول مرة أخرى.");
  return;
}

await window.registerWithFirebase(
  id,
  password,
  name,
  className,
  studentSection,
  studentGender
);
    await fetch(GOOGLE_SHEET_URL, {
  method: "POST",
  mode: "no-cors",
  headers: {
    "Content-Type": "text/plain;charset=utf-8"
  },
  body: JSON.stringify({
    action: "register",
    name: name,
    studentId: id,
    className: className,
    studentSection: studentSection,
    password: password
  })
});
    localStorage.setItem("basketballStudentId", id);
    localStorage.setItem("basketballStudentName", name);
    localStorage.setItem("basketballClassName", className);
    localStorage.setItem("basketballStudentSection", studentSection);

    document.getElementById("studentName").textContent = name;
    document.getElementById("studentClass").textContent = "الصف " + className;

    await showWelcomeWithRobotTransition();

  } catch (error) {
    console.error("Duplicate check error:", error);
    notify("تعذر التحقق من التسجيل. تأكد من الاتصال وحاول مرة أخرى.");
  }
});

document.getElementById("startBtn").addEventListener("click", () => {
  updateLearningProgressBar();
  showPage("dashboardPage");
});



function getLearningProgressKey() {
  const studentId = localStorage.getItem("basketballStudentId") || "guest";
  return "basketballLearningProgress_" + studentId;
}

function loadLearningProgress() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(getLearningProgressKey()) || "[]"
    );
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

function markLearningSection(section) {
  const completedSections = loadLearningProgress();

  if (!completedSections.includes(section)) {
    completedSections.push(section);
    localStorage.setItem(
      getLearningProgressKey(),
      JSON.stringify(completedSections)
    );
  }

  updateLearningProgressBar();
}

async function restoreSavedLearningProgress() {
  try {
    if (typeof window.getSavedLearningProgress !== "function") {
      return;
    }

    const savedProgress = await window.getSavedLearningProgress();

    const studentId = localStorage.getItem("basketballStudentId") || "guest";
    const progressKey = "basketballSavedProgress_" + studentId;

    const previousSaved = Number(localStorage.getItem(progressKey) || 0);

    localStorage.setItem(
      progressKey,
      String(Math.max(previousSaved, savedProgress))
    );

    updateLearningProgressBar();
  } catch (error) {
    console.error("Restore learning progress error:", error);
  }
}

function updateLearningProgressBar() {
  const completedSections = loadLearningProgress();

  const weights = {
    lessons: 30,
    chat: 40
  };

  const sectionProgress = completedSections.reduce(
  (total, section) => total + (weights[section] || 0),
  0
);

const reviewKey =
  "basketballReviewPoints_" +
  (localStorage.getItem("basketballStudentId") || "guest");

const reviewPoints = Number(
  localStorage.getItem(reviewKey) || 0
);

const localPercent = Math.min(100, sectionProgress + reviewPoints);

const studentId = localStorage.getItem("basketballStudentId") || "guest";
const savedPercent = Number(
  localStorage.getItem("basketballSavedProgress_" + studentId) || 0
);

const percent = Math.max(localPercent, savedPercent);


  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");

  if (progressBar) {
    progressBar.style.width = percent + "%";
  }

  
if (progressText) {
  progressText.textContent =
    percent === 0
      ? "أنجز أول قسم لتبدأ رحلتك!"
      : "أنجزت " + percent + "٪ من تقدمك التعليمي.";
}

const profileProgressPercent = document.getElementById("profileProgressPercent");

if (profileProgressPercent) {
  profileProgressPercent.textContent = percent + "%";
}

if (typeof window.saveLeaderboardProgress === "function") {
  window.saveLeaderboardProgress(percent).catch(error => {
    console.error("Save leaderboard progress error:", error);
  });
}
}


updateLearningProgressBar();

document.querySelectorAll("[data-action]").forEach(button => {
  button.addEventListener("click", async () => {
    const a = button.dataset.action;

    if (a === "lessons") {
      markLearningSection("lessons");
      showPage("lessonsPage");

    } else if (a === "open-review") {
      try {
        if (typeof window.checkQuizAttempt !== "function") {
          notify("تعذر التحقق من حالة الاختبار. حاول مرة أخرى.");
          return;
        }

        const completed = await window.checkQuizAttempt();

        if (completed) {
          notify("أنت أكملت مراجعة مهارة التنطيط بالفعل، ولا يمكن تكرار الاختبار.");
        } else {
          
          showPage("reviewPage");
          renderQuestion();
        }
      } catch (error) {
        console.error("Check quiz attempt error:", error);
        notify("تعذر التحقق من حالة الاختبار. تأكد من الاتصال بالإنترنت.");
      }

    } else if (a === "open-chat") {
      markLearningSection("chat");
      showPage("chatPage");

    } else if (a === "dashboard") {
      showPage("dashboardPage");

    } else if (a === "saved") {
      notify("المهارات المحفوظة هتظهر هنا لاحقًا.");

    } else if (a === "settings") {
      notify("الإعدادات التجريبية.");

    } else if (a === "add") {
      notify("تقدر تضيف دروس جديدة من ملفات المشروع.");
    }
  });
});

document.querySelectorAll("[data-lesson]").forEach(card=>card.addEventListener("click",()=>{const lesson=card.dataset.lesson;if(lesson==="dribble"){showPage("lessonDetailPage");return}notify("صفحة هذا الدرس جاهزة للتطوير لاحقًا.")}));
document.getElementById("goReviewBtn").addEventListener("click",()=>showPage("continueSkillPage"));
document.getElementById("finishSkillBtn").addEventListener("click",()=>showPage("dashboardPage"));

const questions = [
  {
    q: "بستخدم إيدي الشمال أثناء الدريبل عشان:",
    options: [
      "أطلع الكورة خارج الملعب",
      "أحمي بيها الكورة",
      "ملهاش لازمة"
    ],
    correct: 1,
    explanation: "برافو يا بطل! استخدام إيدك الشمال بيساعدك تحمي الكورة من المنافس وتتحكم فيها."
  },
  {
    q: "أحط إيدي إزاي على الكورة؟",
    options: ["براحة إيدي كلها", "بأطراف صوابعي", "بقبضة إيدي"],
    correct: 1,
    explanation: "برافو يا بطل! أطراف الصوابع بتساعدك تتحكم في الكورة."
  },
  {
    q: "وأنا بنطط، أبص فين؟",
    options: ["قدامي وأتابع الملعب", "للأرض طول الوقت", "أغمّض عيني"],
    correct: 0,
    explanation: "ممتاز! ارفع راسك عشان تشوف أصحابك والملعب."
  },
  {
    q: "أثني ركبتي ليه وأنا بنطط؟",
    options: ["عشان أطول", "عشان أبقى متوازن وأتحرك بسهولة", "مش محتاج أثنيها"],
    correct: 1,
    explanation: "صح! ثني الركبتين البسيط بيساعدك تتوازن وتتحكم في الكورة."
  },
  {
    q: "أبدأ أتمرن بإيه؟",
    options: ["أجري بأقصى سرعة", "أنطط وأنا باصص للأرض", "أنطط ببطء وأتحكم في الكورة"],
    correct: 2,
    explanation: "عاش! ابدأ براحة، ولما تتحكم في الكورة زوّد السرعة بالتدريج."
  },
  {
    q: "اختار الصورة اللي بتوضح وضع اليد المناسب للتنطيط",
    images: [
      ["dribble-step-1.jpg", "الصورة الأولى"],
      ["dribble-step-2.jpg", "الصورة الثانية"],
      ["dribble-step-3.jpg", "الصورة الثالثة"],
      ["dribble-step-4.jpg", "الصورة الرابعة"]
    ],
    correct: 0,
    explanation: "أحسنت! استخدم أصابعك والرسغ للتحكم في الكرة."
  }
];

let qIndex=0,answered=false;const correctSet=new Set();
function renderQuestion(){
 const q=questions[qIndex];document.getElementById("reviewQuestion").textContent=q.q;document.getElementById("reviewFeedback").textContent="";
 document.getElementById("nextQuestion").textContent=qIndex===questions.length-1?"إنهاء المراجعة ✓":"السؤال التالي ←";
 const textOptions=document.getElementById("reviewOptions"),imageOptions=document.getElementById("imageAnswerOptions");
 textOptions.innerHTML="";imageOptions.innerHTML="";textOptions.hidden=!!q.images;imageOptions.hidden=!q.images;
 const makeAnswer=(label,i,isImage=false,src="")=>{const btn=document.createElement("button");btn.dataset.answer=i;btn.className=isImage?"image-answer":"";if(isImage){const img=document.createElement("img");img.src="images/"+src;img.alt=label;img.onerror=()=>{img.style.display="none"};const span=document.createElement("span");span.textContent=label;btn.append(img,span)}else btn.textContent=label;btn.addEventListener("click",()=>{if(answered)return;answered=true;const good=i===q.correct;btn.classList.add(good?"correct":"wrong");const group=isImage?imageOptions:textOptions;if(!good&&group.children[q.correct])group.children[q.correct].classList.add("correct");document.getElementById("reviewFeedback").textContent=good?q.explanation:"مش مشكلة، جرّب تاني المرة الجاية! "+q.explanation;if(good)correctSet.add(qIndex);updateProgress()});return btn};
 if(q.images)q.images.forEach((item,i)=>imageOptions.appendChild(makeAnswer(item[1],i,true,item[0])));else q.options.forEach((item,i)=>textOptions.appendChild(makeAnswer(item,i)));
 answered=false;
}

function updateProgress() {
  const points = correctSet.size * 5;

  const quizProgressBar = document.getElementById("quizProgressBar");
  const quizProgressText = document.getElementById("quizProgressText");

  if (quizProgressBar) {
    quizProgressBar.style.width = points + "%";
  }

  if (quizProgressText) {
    quizProgressText.textContent =
      "تقدم مراجعة المهارات: " + points + "٪ من 30٪.";
  }
}

document.getElementById("nextQuestion").addEventListener("click", async () => {
  if (!answered) {
    notify("اختار إجابة الأول يا بطل!");
    return;
  }

  if (qIndex < questions.length - 1) {
    qIndex++;
    renderQuestion();
    return;
  }

  const score = correctSet.size;
  const total = questions.length;
  const questionBox = document.querySelector("#reviewPage .review-question");
  const completionScreen = document.getElementById("reviewCompletion");
  const completionScore = document.getElementById("completionScore");

  try {
    await window.saveQuizAttempt(score, total);

    const reviewKey =
      "basketballReviewPoints_" +
      (localStorage.getItem("basketballStudentId") || "guest");

    localStorage.setItem(reviewKey, String(score * 5));

    sendResultToSheet(score, total);

    completionScore.textContent = score + " من " + total;

    questionBox.hidden = true;
    completionScreen.hidden = false;

    updateLearningProgressBar();
  } catch (error) {
    console.error("Quiz submission error:", error);

    if (error.code === "permission-denied") {
      notify("تم تسجيل إكمال المراجعة من قبل.");
    } else {
      notify("لم نتمكن من حفظ النتيجة. تأكد من الاتصال بالإنترنت وحاول مرة أخرى.");
    }
  }
});

document.getElementById("backToDashboardAfterReview").addEventListener("click", () => {
  showPage("dashboardPage");
});


function normalizeBotText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[؟?!.,،؛:()[\]{}"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const botKnowledge = [
  {
    subject: "المحاورة في كرة السلة",
    keys: ["المحاوره", "المحاورة", "الدريبل", "الدربله", "التنطيط", "ليه بتعلم محاوره", "فايده المحاوره", "هدف المحاوره"],
    reply: "بنتعلم المحاورة عشان نتحرك بالكرة من مكان لمكان، ونحافظ على استحواذنا عليها، ونتجاوز المنافس. ابدأ ببطء، واستخدم أطراف صوابعك، وارفع راسك."
  },
  {
    subject: "كرة السلة في المدرسة",
    keys: ["ليه بندرس سله", "ليه بندرس كره السله", "كرة السلة في المدرسة", "كره السله في المدرسه", "فايده السله في المدرسه", "اهميه كره السله"],
    reply: "بندرس كرة السلة في المدرسة عشان نطوّر التوافق الحركي والسرعة والتوازن، ونتعلم التعاون والالتزام بالقواعد واللعب بروح رياضية."
  },
  {
    subject: "استخدام أطراف الأصابع",
    keys: ["اطراف صوابعي", "اطراف الاصابع", "بصوابعي", "بأطراف صوابعي", "صوابع ايدي", "استخدم صوابعي"],
    reply: "استخدم أطراف صوابعك للتحكم في الكرة، وخلي صوابعك متباعدة بشكل مريح. ادفع الكرة لتحت بحركة متحكم فيها من الرسغ والأصابع."
  },
  {
    subject: "استخدام راحة اليد",
    keys: ["راحه ايدي", "راحة اليد", "بكف ايدي", "اضرب الكوره بكفي", "استخدم كف ايدي"],
    reply: "الأفضل ما تضربش الكرة براحة إيدك كلها. استخدم أطراف صوابعك وتحكم في دفع الكرة بالرسغ عشان المحاورة تبقى أدق."
  },
  {
    subject: "رفع الرأس أثناء المحاورة",
    keys: ["ارفع راسي", "ابص لفين", "ببص على الكوره", "باصص للارض", "بص لقدام", "النظر اثناء المحاوره"],
    reply: "ارفع راسك وابص لقدام قدر الإمكان عشان تشوف زملاءك والمنافسين والمساحة المتاحة، بدل ما تفضل مركز نظرك على الكرة طول الوقت."
  },
  {
    subject: "ثني الركبتين",
    keys: ["اثني ركبتي", "اثني ركبك", "ثني الركبتين", "ليه اثني ركبتي", "ركبي مثنيه", "وضع الركبتين"],
    reply: "اثني ركبتيك قليلًا وخلي جسمك متوازن. الوضع ده بيساعدك تتحرك بسرعة وتغيّر اتجاهك وتتحكم في الكرة بشكل أفضل."
  },
  {
    subject: "استخدام اليد الشمال",
    keys: ["ايدي الشمال", "استخدم الشمال", "اليد الشمال", "ايدي اليسار", "الدريبل بالشمال", "المحاوره بالشمال"],
    reply: "استخدام إيدك الشمال بيساعدك تحمي الكرة من المنافس وتتحرك في اتجاهات مختلفة. اتدرب عليها تدريجيًا حتى لو إيدك اليمين أقوى."
  },
  {
    subject: "استخدام اليد اليمين",
    keys: ["ايدي اليمين", "استخدم اليمين", "اليد اليمين", "الدريبل باليمين", "المحاوره باليمين"],
    reply: "اتدرب على المحاورة بإيدك اليمين والشمال. إتقان الإيدين بيديك اختيارات أكتر أثناء اللعب وبيصعّب على المنافس توقع حركتك."
  },
  {
    subject: "حماية الكرة من المنافس",
    keys: ["احمي الكوره", "حمايه الكوره", "احمي الكره من المنافس", "المنافس ياخد الكوره", "اخبي الكوره", "حماية الكرة"],
    reply: "لحماية الكرة، خلي جسمك بين المنافس والكرة، واستخدم إيدك البعيدة عنه للمحاورة، مع رفع الرأس والحفاظ على التوازن. ما تدفعش المنافس بإيدك."
  },
  {
    subject: "ارتفاع الكرة أثناء المحاورة",
    keys: ["ارتفاع الكوره", "انطط الكوره لحد فين", "الكوره عاليه", "الكوره واطيه", "ارتفاع التنطيط", "انططها قد ايه"],
    reply: "ارتفاع المحاورة بيتغير حسب الموقف. أثناء الحركة تحت ضغط المنافس، خليها منخفضة نسبيًا وقريبة من جسمك، وفي المساحة المفتوحة ممكن تكون أعلى مع استمرار التحكم."
  },
  {
    subject: "قوة دفع الكرة",
    keys: ["قوه التنطيط", "ادفع الكوره بقوه", "اضرب الكوره جامد", "الكوره بتبعد مني", "الكوره بتطير", "قوة دفع الكرة"],
    reply: "استخدم قوة مناسبة للموقف. لو دفعت الكرة بقوة زيادة هتبعد عنك، ولو دفعتها بضعف ممكن تفقد إيقاع المحاورة. زوّد القوة تدريجيًا مع التدريب."
  },
  {
    subject: "التحكم في الكرة",
    keys: ["مش عارف اتحكم", "الكوره بتفلت", "بفقد الكوره", "مش مسيطر على الكوره", "الكره بتبعد", "التحكم في المحاوره"],
    reply: "ابدأ من الثبات، ونطّط الكرة ببطء باستخدام أطراف صوابعك، ثم جرّب الحركة خطوة بخطوة. ركّز على التحكم أولًا وبعدها زوّد السرعة."
  },
  {
    subject: "بداية تعلم المحاورة",
    keys: ["ابدأ اتدرب ازاي", "لسه مبتدئ", "اتعلم المحاوره من الاول", "اول مره انطط", "تدريب المبتدئين", "ابدا منين"],
    reply: "ابدأ بالوقوف بثبات، واثنِ ركبتيك قليلًا، واستخدم أطراف صوابعك، ثم نفّذ محاورة بطيئة بكل إيد. بعد ما تتحكم في الكرة، جرّب الحركة للأمام."
  },
  {
    subject: "تغيير الاتجاه أثناء المحاورة",
    keys: ["اغير اتجاهي", "تغيير الاتجاه", "الف بالكوره", "اتحرك يمين وشمال", "مناوره بالمحاوره", "اتجاوز المنافس"],
    reply: "لتغيير الاتجاه، حافظ على ثني الركبتين والتوازن، وتحكم في الكرة بعيدًا عن المنافس. اتدرّب على الانتقال من اليمين للشمال ببطء قبل زيادة السرعة."
  },
  {
    subject: "فوائد كرة السلة",
    keys: ["فوائد كرة السلة", "فايده كره السله", "ليه العب باسكت", "ليه العب كرة السلة", "اهميه لعب السله", "استفيد ايه من السله"],
    reply: "كرة السلة بتساعدك تطوّر اللياقة والتوافق بين العين واليد والسرعة والتوازن، وكمان بتعلمك التعاون واتخاذ القرار واحترام القواعد."
  },
  {
    subject: "التعاون والعمل الجماعي",
    keys: ["التعاون في السله", "العمل الجماعي", "العب لوحدي", "اساعد فريقي", "التعاون مع زمايلي", "اللعب الجماعي"],
    reply: "كرة السلة لعبة جماعية؛ النجاح مش بالتسجيل فقط. مرّر لزميلك لو كان في وضع أفضل، وتواصل مع الفريق، والتزم بدورك داخل الملعب."
  },
  {
    subject: "قواعد كرة السلة",
    keys: ["قواعد السله", "قوانين كرة السلة", "قانون المشي", "مخالفات السله", "امتى تبقى مخالفه", "قواعد اللعب"],
    reply: "قواعد كرة السلة بتنظم اللعب وتضمن العدالة. من المهم تتجنب المشي بالكرة من غير محاورة، وتحترم حدود الملعب، وتتجنب الاحتكاك غير القانوني."
  },
  {
    subject: "التمريرة الصدرية",
    keys: ["التمريره الصدريه", "تمريره من الصدر", "امرر من صدري", "ازاي اعمل تمريره صدريه", "التمرير الصدري"],
    reply: "في التمريرة الصدرية، امسك الكرة أمام الصدر وادفعها ناحية زميلك باليدين، مع مد الذراعين وتوجيه الأصابع للخارج في نهاية الحركة."
  },
  {
    subject: "التمريرة المرتدة",
    keys: ["التمريره المرتده", "تمريره على الارض", "تمريرة أرضية", "ازاي اعمل تمريره مرتده", "التمرير المرتد"],
    reply: "في التمريرة المرتدة، وجّه الكرة للأرض بحيث ترتد ناحية زميلك. اختار مكان الارتداد المناسب عشان توصل له الكرة بسهولة."
  },
  {
    subject: "التصويب على السلة",
    keys: ["التصويب", "اصوب ازاي", "ارمي الكوره في السله", "التسديد", "ازاي اسجل نقطه", "التصويب على السلة"],
    reply: "للتصويب، حافظ على التوازن، ووجّه جسمك نحو السلة، واستخدم يد التصويب لتوجيه الكرة واليد الأخرى للمساعدة في تثبيتها. اتدرّب من مسافة مناسبة."
  },
  {
    subject: "التصويبة السلمية",
    keys: ["التصويبه السلميه", "اللي اب", "layup", "التصويب السلمي", "اصوب وانا بجري", "التصويبة السلمية"],
    reply: "التصويبة السلمية بتتعمل قرب السلة بعد خطوات الاقتراب القانونية. اتدرّب على ترتيب الخطوات والارتقاء والتصويب بهدوء، مع اتباع شرح المدرّب."
  },
  {
    subject: "الدفاع في كرة السلة",
    keys: ["الدفاع", "ادافع ازاي", "امنع المنافس", "الوضع الدفاعي", "الدفاع عن السله", "الدفاع في الباسكت"],
    reply: "في الدفاع، اثنِ ركبتيك، وحافظ على توازنك، وراقب حركة المنافس والكرة. تحرك بخطوات جانبية وتجنب دفع المنافس أو عرقلته."
  },
  {
    subject: "الإحماء قبل اللعب",
    keys: ["الاحماء", "اسخن قبل اللعب", "ليه نسخن", "تمارين التسخين", "قبل ما العب", "الإحماء قبل كرة السلة"],
    reply: "الإحماء بيجهّز جسمك للنشاط تدريجيًا. ابدأ بحركة خفيفة وتمارين ديناميكية مناسبة، وبعدها انتقل لمهارات الكرة، من غير إجهاد مفاجئ."
  },
  {
    subject: "اللياقة البدنية",
    keys: ["اللياقه البدنيه", "ازود لياقتي", "اتعب بسرعه", "اجري بسرعه", "التحمل", "اللياقة في كرة السلة"],
    reply: "اللياقة في كرة السلة بتحتاج سرعة وتحمل وتوازن وتوافق. اتدرّب بانتظام، وزوّد شدة التدريب تدريجيًا، وخد فترات راحة مناسبة."
  },
  {
    subject: "تحسين مستوى اللعب",
    keys: ["اطور مستوايا", "ابقى شاطر", "احسن لعبي", "اتدرب كل يوم", "ازاي ابقى محترف", "تحسين مهاراتي"],
    reply: "عشان تطوّر مستواك، خصص وقتًا للتدريب المنتظم، وابدأ بالمهارات الأساسية، وكرّر الحركة بطريقة صحيحة، واطلب ملاحظات المدرّب، وقارن تقدمك بنفسك."
  }
];

// 25 موضوعًا × 10 قوالب × 8 صيغ بداية = 2000 صيغة سؤال
const questionTemplates = [
  s => `ليه ${s}؟`,
  s => `ايه فايدة ${s}؟`,
  s => `ما اهمية ${s}؟`,
  s => `هو ${s} مهم ليه؟`,
  s => `ممكن تشرحلي ${s}؟`,
  s => `عايز اعرف عن ${s}`,
  s => `ازاي اتعلم ${s}؟`,
  s => `ايه الصح في ${s}؟`,
  s => `ايه الاخطاء في ${s}؟`,
  s => `اتدرب على ${s} ازاي؟`
];

const questionPrefixes = [
  "",
  "ممكن اسأل: ",
  "لو سمحت، ",
  "انا عايز اعرف: ",
  "عندي سؤال: ",
  "يا مستر، ",
  "مش فاهم، ",
  "يعني "
];

const generatedQuestionBank = botKnowledge.flatMap(topic =>
  questionPrefixes.flatMap(prefix =>
    questionTemplates.map(makeQuestion => ({
      question: normalizeBotText(prefix + makeQuestion(topic.subject)),
      reply: topic.reply,
      topic: topic.subject
    }))
  )
);

function getBotReply(question) {
  const n = normalizeBotText(question);
  
  // أسئلة عامة ومقارنات رياضية
  if (
    n.includes("اصعب السله ولا القدم") ||
    n.includes("اصعب كره السله ولا كره القدم") ||
    n.includes("انهي اصعب") ||
    n.includes("مين اصعب السله") ||
    n.includes("السله ولا الكوره") ||
    n.includes("كرة السلة ولا القدم")
  ) {
    return "سؤال حلو يا بطل! 🏀⚽ مفيش لعبة أصعب على كل الناس؛ ده بيختلف حسب مهارات كل لاعب. كرة السلة محتاجة تحكم دقيق في الكرة باليد، وتنطيط وتمرير وتصويب وقرارات سريعة في مساحة محدودة. وكرة القدم محتاجة تحكم بالقدم، وجري وتحمل وتحرك وتعاون على مساحة أكبر. الأصعب بالنسبة لك يعتمد على المهارات اللي بتتقنها ومدى تدريبك!";
  }

  if (!n) {
    return "اكتب سؤالك يا بطل، وأنا هساعدك في تعلم كرة السلة! 🏀";
  }

  if (
    ["السلام عليكم", "اهلا", "اهلا يا مستر", "مرحبا", "هاي", "hello", "ازيك"].some(
      phrase => n.includes(normalizeBotText(phrase))
    )
  ) {
    return "أهلًا يا بطل! 🏀 اسألني عن المحاورة أو التمرير أو التصويب أو قواعد كرة السلة.";
  }

  if (
    ["شكرا", "متشكر", "تسلم", "تمام يا مستر", "شكرا يا مستر"].some(
      phrase => n.includes(normalizeBotText(phrase))
    )
  ) {
    return "العفو يا بطل! 💪 استمر في التدريب، وافتكر إن إتقان المهارات بييجي بالتدرج والتكرار الصحيح.";
  }

  // البحث في 2000 صيغة سؤال مولّدة
  const exactMatch = generatedQuestionBank.find(
    item => item.question === n
  );

  if (exactMatch) {
    return exactMatch.reply;
  }

  // فهم الأسئلة المكتوبة بصيغ أخرى باستخدام الكلمات المفتاحية
  const matchedTopic = botKnowledge.find(topic =>
    topic.keys.some(key => n.includes(normalizeBotText(key)))
  );

  if (matchedTopic) {
    return matchedTopic.reply;
  }

  // رد مساعد عند عدم معرفة المقصود
  return "سؤال جميل يا بطل! 🏀 ممكن توضحلي تقصد المحاورة ولا التمرير ولا التصويب ولا قواعد اللعب؟ اكتب سؤالك بطريقة تانية وأنا هحاول أساعدك.";
}

function addMessage(text,who){const el=document.createElement("div");el.className="message "+who;el.textContent=text;document.getElementById("chatMessages").appendChild(el);el.scrollIntoView({behavior:"smooth",block:"nearest"})}

async function sendQuestion(question) {
  const clean = question.trim();
  if (!clean) return;

  
addMessage(clean, "user");

if (!window.chatHistory) {
  window.chatHistory = [];
}

window.chatHistory.push({
  role: "user",
  text: clean
});


  const input = document.getElementById("chatInput");
  input.value = "";

  const sendButton = document.querySelector(
    '#chatForm button[type="submit"]'
  );

  if (sendButton) sendButton.disabled = true;
  input.disabled = true;

  addMessage("ثواني يا بطل، بفكر في إجابة سؤالك... 🏀", "bot");

  try {
    const response = await fetch(
      "https://basketball-ai-assistant.mr-capkarim.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },     
body: JSON.stringify({
  message: clean,
  history: (window.chatHistory || []).slice(0, -1)
})
      }
    );

    const data = await response.json();

    if (!response.ok || !data.reply) {
  throw new Error(
    "HTTP " + response.status + " | " +
    JSON.stringify(data)
  );
}

    const messages = document.getElementById("chatMessages");
    const lastBotMessage = messages.querySelector(
      ".message.bot:last-child"
    );

    
    if (
      lastBotMessage &&
      lastBotMessage.textContent ===
        "ثواني يا بطل، بفكر في إجابة سؤالك... 🏀"
    ) {
      lastBotMessage.textContent = data.reply;
    } else {
      addMessage(data.reply, "bot");
    }

    window.chatHistory.push({
      role: "model",
      text: data.reply
    });

  } catch (error) {
  console.error("Chat assistant error:", error);

  addMessage(
    "حصل خطأ: " + error.message,
    "bot"
  );
}
  finally {
    input.disabled = false;
    if (sendButton) sendButton.disabled = false;
    input.focus();
  }
}

document.querySelectorAll("#suggestedQuestions button").forEach(button => {
  button.addEventListener("click", () => {
    sendQuestion(button.textContent);
  });
});

document.getElementById("chatForm").addEventListener("submit", event => {
  event.preventDefault();
  sendQuestion(document.getElementById("chatInput").value);
});

document.getElementById("chatInfo").addEventListener("click", () => {
  notify(
    "المساعد متصل بالذكاء الاصطناعي للإجابة عن أسئلتك التعليمية."
  );
});

const video = document.getElementById("dribbleVideo");
const videoPlaceholder = document.getElementById("videoPlaceholder");

video.addEventListener("loadeddata", () => {
  videoPlaceholder.style.display = "none";
});

video.addEventListener("error", () => {
  videoPlaceholder.style.display = "flex";
});

renderQuestion();

const GOOGLE_SHEET_URL = "https://misty-sea-ab60p-basketball-bridgee.mr-capkarim.workers.dev/";
function sendResultToSheet(score, total) {
  const studentId = localStorage.getItem("basketballStudentId") || "";
  const studentName = localStorage.getItem("basketballStudentName") || "";
  const className = localStorage.getItem("basketballClassName") || "";
  const studentSection = localStorage.getItem("basketballStudentSection") || "";

  fetch(GOOGLE_SHEET_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      name: studentName,
      studentId: studentId,
      className: className,
      studentSection: studentSection,
      score: score,
      total: total
    })
  }).catch(error => console.error("Sheet error:", error));
}



function checkStudentDuplicate(studentId, attempt = 1) {
  return new Promise((resolve, reject) => {
    const callbackName =
      "studentCheck_" + Date.now() + "_" + attempt;

    const script = document.createElement("script");
    let finished = false;

    const cleanup = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    };

    const retryOrReject = error => {
      cleanup();

      if (attempt < 3) {
        setTimeout(() => {
          checkStudentDuplicate(studentId, attempt + 1)
            .then(resolve)
            .catch(reject);
        }, 1000);
      } else {
        reject(error);
      }
    };

    const timeout = setTimeout(() => {
      retryOrReject(new Error("انتهت مهلة التحقق"));
    }, 8000);

    window[callbackName] = result => {
      if (!result || typeof result.duplicate !== "boolean") {
        retryOrReject(new Error("استجابة غير صحيحة"));
        return;
      }

      cleanup();
      resolve(result.duplicate);
    };

    script.onerror = () => {
      retryOrReject(new Error("فشل الاتصال بالشيت"));
    };

    const separator = GOOGLE_SHEET_URL.includes("?") ? "&" : "?";

    script.src =
      GOOGLE_SHEET_URL +
      separator +
      "studentId=" + encodeURIComponent(studentId) +
      "&callback=" + encodeURIComponent(callbackName) +
      "&t=" + Date.now();

    document.body.appendChild(script);
  });
}

async function loadStudentLeaderboards() {
  const schoolBody = document.getElementById("schoolLeaderboardBody");
  const classBody = document.getElementById("classLeaderboardBody");

  if (!schoolBody || !classBody) return;

  schoolBody.innerHTML = '<tr><td colspan="4">جارٍ تحميل الترتيب...</td></tr>';
  classBody.innerHTML = '<tr><td colspan="3">جارٍ تحميل الترتيب...</td></tr>';

  try {
    if (
      typeof window.getLeaderboardData !== "function" ||
      typeof window.getCurrentStudentUid !== "function"
    ) {
      throw new Error("LEADERBOARD_FUNCTIONS_NOT_READY");
    }

    const students = await window.getLeaderboardData();
    const currentUid = window.getCurrentStudentUid();

    const currentClass =
      localStorage.getItem("basketballClassName") || "";

    const currentSection =
      localStorage.getItem("basketballStudentSection") || "";

    const sortStudents = list =>
      list.sort((a, b) => Number(b.progress || 0) - Number(a.progress || 0));

    const schoolList = sortStudents([...students]);

    const classList = sortStudents(
      students.filter(student =>
        student.className === currentClass &&
        String(student.studentSection || "") === currentSection
      )
    );

    function renderList(list, body, limit, columns) {
      const visible = list.slice(0, limit);
      const current = list.find(student => student.id === currentUid);

      if (current && !visible.some(student => student.id === currentUid)) {
        visible.push(current);
      }

      if (!visible.length) {
        body.innerHTML =
          `<tr><td colspan="${columns}">لا يوجد طلاب مسجلون في الترتيب حتى الآن</td></tr>`;
        return;
      }

      body.innerHTML = visible.map(student => {
        const rank = list.findIndex(item => item.id === student.id) + 1;
        const progress = Math.round(Number(student.progress) || 0);
        const isCurrent = student.id === currentUid;

        
let rankContent = "—";
let rankClass = "";

if (progress > 0) {
  if (rank === 1) {
    rankContent = "1";
    rankClass = "rank-medal rank-gold";
  } else if (rank === 2) {
    rankContent = "2";
    rankClass = "rank-medal rank-silver";
  } else if (rank === 3) {
    rankContent = "3";
    rankClass = "rank-medal rank-bronze";
  } else {
    rankContent = String(rank);
    rankClass = "rank-number";
  }
}

        const name = String(student.name || "طالب").replace(/[&<>"']/g, char => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        })[char]);

        const className = String(student.className || "").replace(/[&<>"']/g, char => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        })[char]);

        return `
          <tr class="${isCurrent ? "current-student-row" : ""}">
            <td><span class="progress-value">${progress}%</span></td>
            ${columns === 4 ? `<td>${className}</td>` : ""}
            <td>${name}${isCurrent ? " (أنت)" : ""}</td>
            <td>
              ${progress > 0
                 ? `<span class="${rankClass}">${rankContent}</span>`
                 : "—"}
            </td>
          </tr>
        `;
      }).join("");
    }

    renderList(schoolList, schoolBody, 12, 4);
    renderList(classList, classBody, 7, 3);

  } catch (error) {
    console.error("Leaderboard loading error:", error);
    schoolBody.innerHTML =
      '<tr><td colspan="4">تعذر تحميل ترتيب المدرسة</td></tr>';
    classBody.innerHTML =
      '<tr><td colspan="3">تعذر تحميل ترتيب الفصل</td></tr>';
  }
}
