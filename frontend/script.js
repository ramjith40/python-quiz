const FULL_DASH = 339.29;
const API_BASE = "http://localhost:5000";
let questions = [];
let answers = {};
let startTime = null;

let currentIndex = 0;
let timeLeft = 30;
let timer = null;

function startQuiz() {
  

  const nameInput = document.getElementById("name");
  if (!nameInput || !nameInput.value.trim()) {
    alert("Enter your name");
    return;
  }

  fetch("http://127.0.0.1:5000/questions")
    .then(res => {
      if (!res.ok) throw new Error("Backend error");
      return res.json();
    })
    .then(data => {
      

      questions = data.questions;
      startTime = data.start_time;
      currentIndex = 0;
      answers = {};
      document.getElementById("timerWrapper").style.display = "block";
      document.getElementById("name").disabled = true;

      showQuestion();
    })
    .catch(err => {
      console.error(err);
      alert("Cannot reach backend");
    });
}

function showQuestion() {
  if (currentIndex >= questions.length) {
    submitQuiz();
    return;
  }

  const q = questions[currentIndex];
  timeLeft = 30;

  document.getElementById("quiz").innerHTML = `
    <h3>Question ${currentIndex + 1} / ${questions.length}</h3>
    <pre>${q.code}</pre>
    <input id="answerInput" placeholder="Type output here">
  `;

  // Reset timer UI
  const ring = document.getElementById("progress-ring");
  ring.style.strokeDashoffset = 0;
  ring.classList.remove("warning-ring");
  document.getElementById("timer").classList.remove("warning");

  // Button logic
  const nextBtn = document.getElementById("nextBtn");
  if (currentIndex < questions.length - 1) {
    nextBtn.innerText = "Next";
    nextBtn.style.display = "block";
  } else {
    nextBtn.innerText = "Submit";
    nextBtn.style.display = "block";
  }

  startTimer();
}

function startTimer() {
  if (timer) clearInterval(timer);

  timeLeft = 30;
  updateTimer();

  timer = setInterval(() => {
    timeLeft--;
    updateTimer();

    if (timeLeft <= 0) {
      saveAnswer();
      clearInterval(timer);

      if (currentIndex === questions.length - 1) {
        submitQuiz();
      } else {
        currentIndex++;
        showQuestion();
      }
    }
  }, 1000);
}


function updateTimer() {
  const timerText = document.getElementById("timer");
  const ring = document.getElementById("progress-ring");

  timerText.innerText = timeLeft;

  const offset = FULL_DASH * (1 - timeLeft / 30);
  ring.style.strokeDashoffset = offset;

  if (timeLeft <= 5) {
    timerText.classList.add("warning");
    ring.classList.add("warning-ring");
  } else {
    timerText.classList.remove("warning");
    ring.classList.remove("warning-ring");
  }
}



function saveAnswer() {
  const input = document.getElementById("answerInput");
  if (input) {
    answers[questions[currentIndex].id] = input.value.trim();
  }
}

function submitQuiz() {
  clearInterval(timer);
  saveAnswer();

  document.getElementById("quiz").innerHTML =
    "<h3>Submitting results...</h3>";

  fetch("http://localhost:5000/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: document.getElementById("name").value,
      answers: answers,
      start_time: startTime
    })
  })
    .then(res => res.json())
    .then(result => {
      console.log("Result:", result);
      loadLeaderboard();
    })
    .catch(err => {
      console.error(err);
      alert("Submission failed");
    });
}


function nextQuestion() {
  saveAnswer();
  clearInterval(timer);

  // If this is LAST question → submit
  if (currentIndex === questions.length - 1) {
    submitQuiz();
    return;
  }

  // Otherwise go to next question
  currentIndex++;
  showQuestion();
}

function loadLeaderboard() {
  fetch("http://localhost:5000/leaderboard")
    .then(res => res.json())
    .then(data => {
      const ul = document.getElementById("leaderboard");
      ul.innerHTML = "";

      data.forEach(item => {
        ul.innerHTML +=
          `<li>${item.name} — ${item.score} — ${item.time}s</li>`;
      });

      // ✅ ALWAYS reset after leaderboard updates
      resetQuizUI();
    });
}

function resetQuizUI() {
  clearInterval(timer);
  timer = null;

  questions = [];
  answers = {};
  currentIndex = 0;
  startTime = null;
  timeLeft = 30;

  document.getElementById("quiz").innerHTML = "";

  // Hide timer completely
  const wrapper = document.getElementById("timerWrapper");
  if (wrapper) wrapper.style.display = "none";

  // Reset timer visuals
  document.getElementById("timer").innerText = "";
  document.getElementById("timer").classList.remove("warning");

  const ring = document.getElementById("progress-ring");
  ring.style.strokeDashoffset = 0;
  ring.classList.remove("warning-ring");

  // Hide Next/Submit
  document.getElementById("nextBtn").style.display = "none";
  document.getElementById("name").disabled = false;

  // Clear name for next player
  document.getElementById("name").value = "";
}
