import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const QUIZ_LIST_PATH = "data/quiz-list.json";
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const state = { topics: [], selectedTopic: null, quiz: null, quizInfo: null, currentIndex: 0, score: 0, answered: false, responses: [] };

const menuView = document.getElementById("menu-view");
const quizView = document.getElementById("quiz-view");
const quizMenu = document.getElementById("quiz-menu");
const menuTitle = document.getElementById("menu-title");
const menuSubtitle = document.getElementById("menu-subtitle");
const quizTitle = document.getElementById("quiz-title");
const quizMeta = document.getElementById("quiz-meta");
const questionCount = document.getElementById("question-count");
const progressBar = document.getElementById("progress-bar");
const questionText = document.getElementById("question-text");
const diagramContainer = document.getElementById("diagram-container");
const optionsEl = document.getElementById("options");
const feedback = document.getElementById("feedback");
const feedbackTitle = document.getElementById("feedback-title");
const feedbackText = document.getElementById("feedback-text");
const nextBtn = document.getElementById("next-btn");
const backBtn = document.getElementById("back-btn");
const card = document.getElementById("quiz-card");

function renderMathIn(element) {
  if (typeof renderMathInElement !== "function") return;
  renderMathInElement(element, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false },
      { left: "\\(", right: "\\)", display: false },
      { left: "\\[", right: "\\]", display: true }
    ],
    throwOnError: false
  });
}

function setMathText(element, text) {
  element.textContent = text;
  renderMathIn(element);
}

function topicIcon(icon) {
  const icons = {
    number: `<svg viewBox="0 0 120 90"><rect x="16" y="12" width="28" height="28" rx="6"/><rect x="52" y="12" width="28" height="28" rx="6"/><rect x="16" y="50" width="28" height="28" rx="6"/><rect x="52" y="50" width="28" height="28" rx="6"/><text x="30" y="33">÷</text><text x="66" y="33">+</text><text x="30" y="71">×</text><text x="66" y="71">−</text></svg>`,
    algebra: `<svg viewBox="0 0 150 90"><rect x="18" y="18" width="114" height="54" rx="7"/><text x="75" y="55">(a+b)</text></svg>`,
    ratio: `<svg viewBox="0 0 120 90"><circle cx="60" cy="45" r="34"/><path d="M60 45 L60 11 A34 34 0 0 1 94 45 Z"/><line x1="60" y1="11" x2="60" y2="79"/><line x1="26" y1="45" x2="94" y2="45"/></svg>`,
    geometry: `<svg viewBox="0 0 130 100"><polygon points="65,8 18,76 106,76"/><polygon points="18,76 50,92 106,76 78,60"/><line x1="65" y1="8" x2="50" y2="92"/><line x1="65" y1="8" x2="78" y2="60"/></svg>`,
    probability: `<svg viewBox="0 0 120 100"><polygon points="60,10 95,30 60,50 25,30"/><polygon points="25,30 60,50 60,90 25,70"/><polygon points="95,30 60,50 60,90 95,70"/><circle cx="60" cy="28" r="4"/><circle cx="40" cy="48" r="4"/><circle cx="48" cy="62" r="4"/><circle cx="40" cy="74" r="4"/><circle cx="78" cy="48" r="4"/><circle cx="84" cy="66" r="4"/></svg>`,
    statistics: `<svg viewBox="0 0 140 100"><rect x="22" y="54" width="18" height="36" rx="4"/><rect x="52" y="46" width="18" height="44" rx="4"/><rect x="82" y="62" width="18" height="28" rx="4"/><rect x="112" y="34" width="18" height="56" rx="4"/><polyline points="31,40 61,28 91,42 121,10"/><circle cx="31" cy="40" r="4"/><circle cx="61" cy="28" r="4"/><circle cx="91" cy="42" r="4"/><circle cx="121" cy="10" r="4"/></svg>`
  };
  return icons[icon] || icons.number;
}

async function loadQuizList() {
  try {
    const response = await fetch(QUIZ_LIST_PATH);
    if (!response.ok) throw new Error(`Could not load quiz list: ${response.status}`);
    const list = await response.json();
    state.topics = Array.isArray(list) && list[0] && list[0].quizzes ? list : [{ topic: "Quizzes", icon: "number", quizzes: list }];
    renderTopicMenu();
  } catch (error) {
    showLoadError(error);
  }
}

function renderTopicMenu() {
  menuView.classList.remove("hidden");
  quizView.classList.add("hidden");
  state.selectedTopic = null;
  menuTitle.textContent = "Diagnostic Quizzes";
  menuSubtitle.textContent = "Select a topic.";
  quizMenu.className = "quiz-menu topic-menu";
  quizMenu.innerHTML = "";

  state.topics.forEach((topic) => {
    const button = document.createElement("button");
    button.className = "topic-card-btn";
    button.type = "button";
    button.innerHTML = `<span class="topic-card-title">${topic.topic}</span><span class="topic-card-icon">${topicIcon(topic.icon)}</span>`;
    button.addEventListener("click", () => renderQuizMenu(topic));
    quizMenu.appendChild(button);
  });
}

function renderQuizMenu(topic) {
  state.selectedTopic = topic;
  menuView.classList.remove("hidden");
  quizView.classList.add("hidden");
  menuTitle.textContent = topic.topic;
  menuSubtitle.textContent = topic.quizzes.length ? "Choose a quiz to begin." : "No quizzes in this topic yet.";
  quizMenu.className = "quiz-menu";
  quizMenu.innerHTML = "";

  const backButton = document.createElement("button");
  backButton.className = "quiz-card-btn back-topic-btn";
  backButton.type = "button";
  backButton.innerHTML = `<div class="quiz-card-title">← Back to topics</div>`;
  backButton.addEventListener("click", renderTopicMenu);
  quizMenu.appendChild(backButton);

  topic.quizzes.forEach((quizInfo) => {
    const button = document.createElement("button");
    button.className = "quiz-card-btn";
    button.type = "button";
    button.innerHTML = `<div class="quiz-card-title"></div>`;
    button.querySelector(".quiz-card-title").textContent = quizInfo.title;
    button.addEventListener("click", () => loadQuiz(quizInfo));
    quizMenu.appendChild(button);
  });
}

async function loadQuiz(quizInfo) {
  try {
    const response = await fetch(quizInfo.file);
    if (!response.ok) throw new Error(`Could not load quiz: ${response.status}`);
    state.quiz = await response.json();
    state.quizInfo = quizInfo;
    state.currentIndex = 0;
    state.score = 0;
    state.answered = false;
    state.responses = [];
    menuView.classList.add("hidden");
    quizView.classList.remove("hidden");
    renderQuestion();
  } catch (error) {
    showLoadError(error);
  }
}

function showLoadError(error) {
  card.innerHTML = `<h1 class="summary-title">Quiz could not load</h1><p style="font-size: 1.2rem; color: var(--muted);">A file could not be loaded.</p><pre style="white-space: pre-wrap; background: #f7f7f7; padding: 16px; border-radius: 12px;">${error.message}</pre>`;
}

function renderDiagram(diagram) {
  if (!diagramContainer) return;
  if (!diagram || diagram.type !== "svg" || !diagram.content) {
    diagramContainer.innerHTML = "";
    diagramContainer.classList.add("hidden");
    return;
  }
  const captionHtml = diagram.caption ? `<div class="diagram-caption">${diagram.caption}</div>` : "";
  diagramContainer.innerHTML = `<div class="diagram-inner">${diagram.content}${captionHtml}</div>`;
  diagramContainer.classList.remove("hidden");
}

function renderQuestion() {
  const quiz = state.quiz;
  const question = quiz.questions[state.currentIndex];
  state.answered = false;
  quizTitle.textContent = quiz.quizTitle;
  quizMeta.textContent = "";
  questionCount.textContent = `Question ${state.currentIndex + 1} of ${quiz.questions.length}`;
  progressBar.style.width = `${(state.currentIndex / quiz.questions.length) * 100}%`;
  setMathText(questionText, question.question);
  renderDiagram(question.diagram);
  optionsEl.innerHTML = "";
  feedback.classList.remove("show");
  feedbackTitle.textContent = "";
  feedbackText.textContent = "";
  nextBtn.classList.remove("show");

  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.className = "option";
    button.type = "button";
    const label = document.createElement("span");
    label.className = "option-label";
    label.textContent = option.label;
    const optionText = document.createElement("span");
    optionText.textContent = option.text;
    button.appendChild(label);
    button.appendChild(optionText);
    renderMathIn(optionText);
    button.addEventListener("click", () => selectOption(index));
    optionsEl.appendChild(button);
  });
}

async function recordAnswer({ question, selectedOption, correctOption }) {
  try {
    await addDoc(collection(db, "responses"), {
      quizFile: state.quizInfo.file,
      quizTitle: state.quiz.quizTitle,
      questionId: question.id,
      questionText: question.question,
      selectedLabel: selectedOption.label,
      selectedText: selectedOption.text,
      correctLabel: correctOption.label,
      correctText: correctOption.text,
      isCorrect: selectedOption.correct,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.warn("Response was not recorded:", error);
  }
}

function selectOption(selectedIndex) {
  if (state.answered) return;
  const quiz = state.quiz;
  const question = quiz.questions[state.currentIndex];
  const selectedOption = question.options[selectedIndex];
  const correctIndex = question.options.findIndex(option => option.correct);
  const correctOption = question.options[correctIndex];
  const optionButtons = Array.from(document.querySelectorAll(".option"));
  state.answered = true;

  optionButtons.forEach((button, index) => {
    button.disabled = true;
    if (index === correctIndex) button.classList.add("correct");
    if (index === selectedIndex && !selectedOption.correct) button.classList.add("selected-incorrect");
  });

  if (selectedOption.correct) {
    state.score += 1;
    feedbackTitle.textContent = "Correct — well done.";
  } else {
    feedbackTitle.textContent = "Not quite.";
  }

  recordAnswer({ question, selectedOption, correctOption });
  setMathText(feedbackText, selectedOption.feedback);
  feedback.classList.add("show");
  nextBtn.textContent = state.currentIndex === quiz.questions.length - 1 ? "See results" : "Next question";
  nextBtn.classList.add("show");

  state.responses.push({
    questionId: question.id,
    question: question.question,
    selected: selectedOption.text,
    correct: correctOption.text,
    wasCorrect: selectedOption.correct,
    feedback: selectedOption.feedback
  });
}

function nextQuestion() {
  const quiz = state.quiz;
  if (state.currentIndex < quiz.questions.length - 1) {
    state.currentIndex += 1;
    renderQuestion();
  } else {
    renderSummary();
  }
}

function renderSummary() {
  const quiz = state.quiz;
  progressBar.style.width = "100%";
  const percentage = Math.round((state.score / quiz.questions.length) * 100);

  quizView.innerHTML = `
    <h1 class="summary-title">Quiz complete</h1>
    <div class="summary-score">You scored ${state.score} out of ${quiz.questions.length} (${percentage}%).</div>
    <p style="font-size: 1.2rem; color: var(--muted); margin-bottom: 18px;">Review the questions below. Green means correct; red means not quite.</p>
    <div class="review-list">
      ${state.responses.map((response, index) => `
        <div class="review-item ${response.wasCorrect ? "review-correct" : "review-not-quite"}">
          <span class="review-icon ${response.wasCorrect ? "correct-icon" : "not-quite-icon"}">${response.wasCorrect ? "✓" : "×"}</span>
          <div>
            <strong>Q${index + 1}: ${response.wasCorrect ? "Correct" : "Not quite"}</strong>
            <span class="math-review">${response.question}</span><br>
            Your answer: <span class="math-review">${response.selected}</span><br>
            Correct answer: <span class="math-review">${response.correct}</span>
          </div>
        </div>
      `).join("")}
    </div>
    <div class="actions">
      <button class="secondary-btn" onclick="location.reload()">Back to menu</button>
      <button class="restart-btn show" onclick="location.reload()">Restart quiz</button>
    </div>
  `;
  renderMathIn(quizView);
}

nextBtn.addEventListener("click", nextQuestion);
backBtn.addEventListener("click", () => {
  if (state.selectedTopic) renderQuizMenu(state.selectedTopic);
  else renderTopicMenu();
});
window.addEventListener("DOMContentLoaded", loadQuizList);
