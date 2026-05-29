import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const QUIZ_LIST_PATH = "data/quiz-list.json";
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const state = { quizList: [], quiz: null, quizInfo: null, currentIndex: 0, score: 0, answered: false, responses: [] };

const menuView = document.getElementById("menu-view");
const quizView = document.getElementById("quiz-view");
const quizMenu = document.getElementById("quiz-menu");
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

function renderDiagram(diagram) {
  if (!diagramContainer) return;

  if (!diagram || diagram.type !== "svg" || !diagram.content) {
    diagramContainer.innerHTML = "";
    diagramContainer.classList.add("hidden");
    return;
  }

  const captionHtml = diagram.caption
    ? `<div class="diagram-caption">${diagram.caption}</div>`
    : "";

  diagramContainer.innerHTML = `
    <div class="diagram-inner">
      ${diagram.content}
      ${captionHtml}
    </div>
  `;
  diagramContainer.classList.remove("hidden");
}

async function loadQuizList() {
  try {
    const response = await fetch(QUIZ_LIST_PATH);
    if (!response.ok) throw new Error(`Could not load quiz list: ${response.status}`);
    state.quizList = await response.json();
    renderMenu();
  } catch (error) {
    showLoadError(error);
  }
}

function renderMenu() {
  menuView.classList.remove("hidden");
  quizView.classList.add("hidden");
  quizMenu.innerHTML = "";
  state.quizList.forEach((quizInfo) => {
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
  card.innerHTML = `
    <h1 class="summary-title">Quiz could not load</h1>
    <p style="font-size: 1.2rem; color: var(--muted);">A file could not be loaded.</p>
    <pre style="white-space: pre-wrap; background: #f7f7f7; padding: 16px; border-radius: 12px;">${error.message}</pre>
  `;
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
backBtn.addEventListener("click", renderMenu);
window.addEventListener("DOMContentLoaded", loadQuizList);
