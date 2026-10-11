const pages=[...document.querySelectorAll(".page")];
const toast=document.getElementById("toast");let toastTimer;
function notify(message){toast.textContent=message;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),2600)}
function showPage(id){pages.forEach(page=>page.classList.toggle("active",page.id===id));window.scrollTo({top:0,behavior:"smooth"})}
setTimeout(()=>{if(document.getElementById("splashPage").classList.contains("active"))showPage("loginPage")},1800);

document.getElementById("loginForm").addEventListener("submit", async event => {
  event.preventDefault();

  const id = document.getElementById("studentId").value.trim();
  const name = document.getElementById("studentNameInput").value.trim();
  const className = document.getElementById("classNameInput").value;
  const studentSection = document.getElementById("studentSectionInput").value.trim();

  if (id.length < 6) {
    notify("اكتب رقمًا تجريبيًا من 6 أرقام على الأقل.");
    return;
  }

  if (!name || !className || !studentSection) {
    notify("اكتب اسم الطالب واختر الصف واكتب الفصل.");
    return;
  }

  try {
    notify("جاري التحقق من التسجيل السابق...");

    const isDuplicate = await checkStudentDuplicate(id);

    if (isDuplicate) {
      notify("الرقم ده مسجّل قبل كده! استخدم بيانات التسجيل السابقة.");
      return;
    }

    localStorage.setItem("basketballStudentId", id);
    localStorage.setItem("basketballStudentName", name);
    localStorage.setItem("basketballClassName", className);
    localStorage.setItem("basketballStudentSection", studentSection);

    document.getElementById("studentName").textContent = name;
    document.getElementById("studentClass").textContent = "الصف " + className;

    showPage("welcomePage");

  } catch (error) {
    console.error("Duplicate check error:", error);
    notify("تعذر التحقق من التسجيل. تأكد من الاتصال وحاول مرة أخرى.");
  }
});
document.getElementById("startBtn").addEventListener("click", () => showPage("dashboardPage"));
document.querySelectorAll("[data-action]").forEach(button=>button.addEventListener("click",()=>{const a=button.dataset.action;if(a==="lessons")showPage("lessonsPage");else if(a==="open-review")showPage("reviewPage");else if(a==="open-chat")showPage("chatPage");else if(a==="dashboard")showPage("dashboardPage");else if(a==="saved")notify("المهارات المحفوظة هتظهر هنا لاحقًا.");else if(a==="settings")notify("الإعدادات التجريبية.");else if(a==="add")notify("تقدر تضيف دروس جديدة من ملفات المشروع.")}));
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
function updateProgress(){const percent=Math.round(correctSet.size/questions.length*100);document.getElementById("progressBar").style.width=percent+"%";document.getElementById("progressText").textContent=`جاوبت صح على ${correctSet.size} من ${questions.length} أسئلة (${percent}٪).`}
document.getElementById("nextQuestion").addEventListener("click",()=>{if(!answered){notify("اختار إجابة الأول يا بطل!");return}if(qIndex<questions.length-1){qIndex++;renderQuestion()}else{notify(`خلصت المراجعة! إجاباتك الصح ${correctSet.size} من ${questions.length}.`);sendResultToSheet(correctSet.size, questions.length);qIndex=0;correctSet.clear();updateProgress();renderQuestion()}});
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

const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyekurr85LXIAkjHPxcX8B0CR-U6xCmnUfy1gT1avoRwSg_v7ZcEm7Pd5ddGdrpT7Y/exec";

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
function checkStudentDuplicate(studentId) {
  return new Promise((resolve, reject) => {
    const callbackName =
      "studentCheck_" + Date.now();

    const script = document.createElement("script");

    const timeout = setTimeout(() => {
      delete window[callbackName];
      script.remove();
      reject(new Error("تعذر الاتصال بالشيت"));
    }, 10000);

    window[callbackName] = result => {
      clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
      resolve(result.duplicate);
    };

    script.src =
      GOOGLE_SHEET_URL +
      "?studentId=" + encodeURIComponent(studentId) +
      "&callback=" + callbackName;

    script.onerror = () => {
      clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
      reject(new Error("فشل الاتصال بالشيت"));
    };

    document.body.appendChild(script);
  });
}
