const pages=[...document.querySelectorAll(".page")];
const toast=document.getElementById("toast");let toastTimer;
function notify(message){toast.textContent=message;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),2600)}
function showPage(id){pages.forEach(page=>page.classList.toggle("active",page.id===id));window.scrollTo({top:0,behavior:"smooth"})}
setTimeout(()=>{if(document.getElementById("splashPage").classList.contains("active"))showPage("loginPage")},1800);
document.getElementById("showExistingLogin").addEventListener("click", () => {
  document.getElementById("loginForm").hidden = true;
  document.getElementById("existingLoginBox").hidden = false;
});

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
  const className = document.getElementById("classNameInput").value;
  const studentSection = document.getElementById("studentSectionInput").value.trim();
  const password = document.getElementById("studentPasswordInput").value;
  if (id.length < 6) {
    notify("اكتب رقمًا تجريبيًا من 6 أرقام على الأقل.");
    return;
  }

  if (!name || !className || !studentSection) {
    notify("اكتب اسم الطالب واختر الصف واكتب الفصل.");
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
  studentSection
);await fetch(GOOGLE_SHEET_URL, {
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

function updateLearningProgressBar() {
  const completedSections = loadLearningProgress();

  const weights = {
    lessons: 30,
    review: 30,
    chat: 40
  };

  const percent = completedSections.reduce(
    (total, section) => total + (weights[section] || 0),
    0
  );

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
          markLearningSection("review");
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
document.getElementById("goReviewBtn").addEventListener("click",()=>showPage("reviewPage"));
const questions=[
 {q:"أحط إيدي إزاي على الكورة؟",options:["براحة إيدي كلها","بأطراف صوابعي","بقبضة إيدي"],correct:1,explanation:"برافو يا بطل! أطراف الصوابع بتساعدك تتحكم في الكورة."},
 {q:"وأنا بنطط، أبص فين؟",options:["قدامي وأتابع الملعب","للأرض طول الوقت","أغمّض عيني"],correct:0,explanation:"ممتاز! ارفع راسك عشان تشوف أصحابك والملعب."},
 {q:"أثني ركبتي ليه وأنا بنطط؟",options:["عشان أطول","عشان أبقى متوازن وأتحرك بسهولة","مش محتاج أثنيها"],correct:1,explanation:"صح! ثني الركبتين البسيط بيساعدك تتوازن وتتحكم في الكورة."},
 {q:"أبدأ أتمرن بإيه؟",options:["أجري بأقصى سرعة","أنطط وأنا باصص للأرض","أنطط ببطء وأتحكم في الكورة"],correct:2,explanation:"عاش! ابدأ براحة، ولما تتحكم في الكورة زوّد السرعة بالتدريج."},
 {q:"اختار الصورة اللي بتوضح وضع اليد المناسب للتنطيط",images:[["dribble-step-1.jpg","الصورة الأولى"],["dribble-step-2.jpg","الصورة الثانية"],["dribble-step-3.jpg","الصورة الثالثة"],["dribble-step-4.jpg","الصورة الرابعة"]],correct:0,explanation:"أحسنت! اختار وضعًا مريحًا بأصابع مفتوحة للتحكم في الكرة، وخلّي دفع الكرة من الأصابع والرسغ."}
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
  const percent = Math.round((correctSet.size / questions.length) * 100);

  const quizProgressBar = document.getElementById("quizProgressBar");
  const quizProgressText = document.getElementById("quizProgressText");

  if (quizProgressBar) {
    quizProgressBar.style.width = percent + "%";
  }

  if (quizProgressText) {
    quizProgressText.textContent =
      "جاوبت صح على " + correctSet.size +
      " من " + questions.length +
      " أسئلة (" + percent + "٪).";
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

const answers=[
 {keys:["إيدي","ايدي","أطراف","صوابع","اصابع","أصابع"],text:"افرد صوابعك بشكل مريح وخليها تلامس الكورة، وادفعها لتحت برفق. بلاش تضربها براحة إيدك."},
 {keys:["أبص","ابص","بص","قدامي","الملعب","الأرض","الارض"],text:"حاول تبص لقدام عشان تشوف الملعب وأصحابك، ومش لازم تفضل باصص للكورة طول الوقت."},
 {keys:["ركب","أثني","اثني","متوازن"],text:"اثني ركبك شوية وخلي جسمك متوازن؛ كده هتتحرك وتغيّر اتجاهك بسهولة."},
 {keys:["يمين","شمال","الشمال","اليمين","إيد"],text:"ابدأ بالإيد اللي مرتاح فيها، وبعد ما تتحكم في الكورة جرّب الإيد التانية واحدة واحدة."},
 {keys:["تنطيط","دربل","دريبل","محاورة"],text:"التنطيط بيساعدك تتحرك بالكورة. ابدأ ببطء، استخدم أطراف صوابعك، وارفع راسك."},
 {keys:["مرحبا","أهلا","السلام","هاي","hello"],text:"أهلًا يا بطل! 🏀 اسألني عن التنطيط أو التمرير أو التصويب."}
];
function getBotReply(question){const n=question.toLowerCase();const found=answers.find(a=>a.keys.some(k=>n.includes(k.toLowerCase())));return found?found.text:"سؤال جميل يا بطل! 🏀 افتكر 3 حاجات: اثني ركبك شوية، استخدم أطراف صوابعك، وارفع راسك."}
function addMessage(text,who){const el=document.createElement("div");el.className="message "+who;el.textContent=text;document.getElementById("chatMessages").appendChild(el);el.scrollIntoView({behavior:"smooth",block:"nearest"})}
function sendQuestion(question){const clean=question.trim();if(!clean)return;addMessage(clean,"user");document.getElementById("chatInput").value="";setTimeout(()=>addMessage(getBotReply(clean),"bot"),300)}
document.querySelectorAll("#suggestedQuestions button").forEach(button=>button.addEventListener("click",()=>sendQuestion(button.textContent)));
document.getElementById("chatForm").addEventListener("submit",event=>{event.preventDefault();sendQuestion(document.getElementById("chatInput").value)});
document.getElementById("chatInfo").addEventListener("click",()=>notify("المساعد نسخة تجريبية بإجابات تعليمية مبرمجة، وليس متصلًا حاليًا بذكاء اصطناعي مباشر."));
const video=document.getElementById("dribbleVideo"),videoPlaceholder=document.getElementById("videoPlaceholder");
video.addEventListener("loadeddata",()=>videoPlaceholder.style.display="none");video.addEventListener("error",()=>videoPlaceholder.style.display="flex");
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
