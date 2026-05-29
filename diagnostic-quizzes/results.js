import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const QUIZ_LIST_PATH = "data/quiz-list.json";
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const quizSelect = document.getElementById("quiz-select");
const timeSelect = document.getElementById("time-select");
const refreshBtn = document.getElementById("refresh-btn");
const resultsSummary = document.getElementById("results-summary");
const resultsOutput = document.getElementById("results-output");

const state = { topics: [], topicSelect: null, currentTopic: null, currentQuizInfo: null, currentQuiz: null };

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

function getSinceDate() {
  const value = timeSelect.value;
  const now = new Date();
  if (value === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  return new Date(now.getTime() - Number(value) * 60 * 1000);
}

function getWindowLabel() {
  if (timeSelect.value === "15") return "last 15 minutes";
  if (timeSelect.value === "30") return "last 30 minutes";
  if (timeSelect.value === "60") return "last 1 hour";
  return "today";
}

function ensureTopicSelect() {
  if (document.getElementById("topic-select")) {
    state.topicSelect = document.getElementById("topic-select");
    return;
  }
  const quizGroup = quizSelect.closest(".control-group");
  const controls = quizGroup.parentElement;
  const topicGroup = document.createElement("div");
  topicGroup.className = "control-group";
  topicGroup.innerHTML = `<label for="topic-select">Topic</label><select id="topic-select"></select>`;
  controls.insertBefore(topicGroup, quizGroup);
  state.topicSelect = document.getElementById("topic-select");
}

async function loadQuizList() {
  const response = await fetch(QUIZ_LIST_PATH);
  if (!response.ok) throw new Error("Could not load quiz list.");
  const list = await response.json();
  state.topics = Array.isArray(list) && list[0] && list[0].quizzes ? list : [{ topic: "Quizzes", icon: "number", quizzes: list }];

  ensureTopicSelect();
  state.topicSelect.innerHTML = "";
  state.topics.forEach((topic, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = topic.topic;
    state.topicSelect.appendChild(option);
  });

  state.topicSelect.addEventListener("change", loadSelectedTopic);
  await loadSelectedTopic();
}

async function loadSelectedTopic() {
  const topic = state.topics[Number(state.topicSelect.value)];
  state.currentTopic = topic;
  quizSelect.innerHTML = "";

  topic.quizzes.forEach((quizInfo, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = quizInfo.title;
    quizSelect.appendChild(option);
  });

  if (topic.quizzes.length === 0) {
    state.currentQuizInfo = null;
    resultsSummary.textContent = `${topic.topic} — no quizzes in this topic yet.`;
    resultsOutput.innerHTML = `<div class="empty-state">No quizzes found for this topic.</div>`;
    return;
  }

  await loadSelectedQuiz();
}

async function loadSelectedQuiz() {
  const quizInfo = state.currentTopic.quizzes[Number(quizSelect.value)];
  state.currentQuizInfo = quizInfo;
  const response = await fetch(quizInfo.file);
  if (!response.ok) throw new Error("Could not load selected quiz.");
  state.currentQuiz = await response.json();
  await loadResults();
}

async function loadResults() {
  if (!state.currentQuizInfo) return;
  resultsOutput.innerHTML = `<div class="empty-state">Loading results...</div>`;
  const sinceTimestamp = Timestamp.fromDate(getSinceDate());
  const responsesQuery = query(collection(db, "responses"), where("createdAt", ">=", sinceTimestamp));
  const snapshot = await getDocs(responsesQuery);
  const responses = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.quizFile === state.currentQuizInfo.file) responses.push(data);
  });
  renderResults(responses);
}

function renderResults(responses) {
  const quiz = state.currentQuiz;
  resultsSummary.textContent = `${quiz.quizTitle} — showing ${responses.length} anonymous responses from the ${getWindowLabel()}.`;

  if (responses.length === 0) {
    resultsOutput.innerHTML = `<div class="empty-state">No responses found for this quiz in the selected time window.</div>`;
    return;
  }

  resultsOutput.innerHTML = quiz.questions.map((question, questionIndex) => {
    const questionResponses = responses.filter((response) => response.questionId === question.id);
    const total = questionResponses.length;
    const diagramHtml = question.diagram && question.diagram.type === "svg" && question.diagram.content
      ? `<div class="results-diagram"><div class="results-diagram-inner">${question.diagram.content}</div></div>`
      : "";

    const optionRows = question.options.map((option) => {
      const count = questionResponses.filter((response) => response.selectedLabel === option.label).length;
      const percentage = total === 0 ? 0 : Math.round((count / total) * 100);
      return `
        <div class="option-row ${option.correct ? "correct-option" : ""}">
          <span class="option-badge">${option.label}</span>
          <div>
            <span class="math-text">${option.text}</span>
            <div class="option-bar-shell"><div class="option-bar" style="width: ${percentage}%"></div></div>
          </div>
          <div class="percentage">${percentage}%</div>
          <div class="count">${count}/${total}</div>
        </div>
      `;
    }).join("");

    return `<section class="question-result"><h2>Q${questionIndex + 1}: <span class="math-text">${question.question}</span></h2>${diagramHtml}${optionRows}</section>`;
  }).join("");

  renderMathIn(resultsOutput);
}

quizSelect.addEventListener("change", loadSelectedQuiz);
timeSelect.addEventListener("change", loadResults);
refreshBtn.addEventListener("click", loadResults);

loadQuizList().catch((error) => {
  resultsOutput.innerHTML = `<div class="empty-state">Could not load results: ${error.message}</div>`;
});
