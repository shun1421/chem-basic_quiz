import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, where } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { quizData } from './questions.js';

// 【ここを自分のAPIキー等に書き換えてください】
const firebaseConfig = {
  apiKey: "AIzaSyBehsuA-Wnurzy1Xt2ZTdjz-pEkE517viI",
  authDomain: "chem-basic-quiz.firebaseapp.com",
  projectId: "chem-basic-quiz",
  storageBucket: "chem-basic-quiz.firebasestorage.app",
  messagingSenderId: "827649945727",
  appId: "1:827649945727:web:1d7d36d7d2837bb2c08f4a",
  measurementId: "G-Y5GKYVF6FF"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentUnit = "";
let currentIndex = 0;
let score = 0;
let combo = 0;
let timer;
let timeLeft = 10;

// 初期化：単元ボタンの生成
const unitContainer = document.getElementById("unit-buttons");
Object.keys(quizData).forEach(unit => {
    const btn = document.createElement("button");
    btn.innerText = unit;
    btn.onclick = () => selectUnit(unit);
    unitContainer.appendChild(btn);
});

// 単元を選択した時の挙動
function selectUnit(unit) {
    currentUnit = unit;
    document.getElementById("ranking-title").innerText = `${unit} のTOP 5`;
    document.getElementById("home-ranking-area").classList.remove("hidden");
    showRanking("home-ranking-list");
}

// クイズ開始ボタン
document.getElementById("start-confirm-button").onclick = () => {
    startQuiz(currentUnit);
};

function startQuiz(unit) {
    currentIndex = 0;
    score = 0;
    combo = 0;
    document.getElementById("home-screen").classList.add("hidden");
    document.getElementById("quiz-screen").classList.remove("hidden");
    showQuestion();
}

function showQuestion() {
    if (currentIndex >= quizData[currentUnit].length) return endQuiz();
    
    const data = quizData[currentUnit][currentIndex];
    document.getElementById("question-text").innerText = data.q;
    const btnContainer = document.getElementById("answer-buttons");
    btnContainer.innerHTML = "";
    
    data.a.forEach((ans, i) => {
        const btn = document.createElement("button");
        btn.innerText = ans;
        btn.onclick = () => checkAnswer(i);
        btnContainer.appendChild(btn);
    });
    
    startTimer();
}

function startTimer() {
    timeLeft = 10;
    document.getElementById("timer-bar").style.width = "100%";
    clearInterval(timer);
    timer = setInterval(() => {
        timeLeft -= 0.1;
        document.getElementById("timer-bar").style.width = (timeLeft * 10) + "%";
        if (timeLeft <= 0) checkAnswer(-1);
    }, 100);
}

function checkAnswer(idx) {
    clearInterval(timer);
    const correct = quizData[currentUnit][currentIndex].correct;
    if (idx === correct) {
        combo++;
        score += 100 + (combo * 50) + Math.floor(timeLeft * 10);
    } else {
        combo = 0;
    }
    document.getElementById("score-display").innerText = `Score: ${score}`;
    document.getElementById("combo-display").innerText = `Combo: ${combo}`;
    currentIndex++;
    setTimeout(showQuestion, 600);
}

async function endQuiz() {
    document.getElementById("quiz-screen").classList.add("hidden");
    document.getElementById("result-screen").classList.remove("hidden");
    document.getElementById("final-score").innerText = `${currentUnit}：${score}点`;
    await showRanking("result-ranking-list");
}

// スコア保存
document.getElementById("save-button").onclick = async () => {
    const name = document.getElementById("player-name").value || "匿名希望";
    document.getElementById("save-button").disabled = true;
    document.getElementById("save-button").innerText = "保存中...";
    try {
        await addDoc(collection(db, "rankings"), {
            name: name,
            unit: currentUnit,
            score: score,
            date: new Date()
        });
        alert("ランキングに登録しました！");
        await showRanking("result-ranking-list");
    } catch (e) {
        console.error(e);
        alert("保存に失敗しました。");
    } finally {
        document.getElementById("save-button").innerText = "登録完了";
    }
};

// ランキング表示関数
async function showRanking(targetId) {
    const display = document.getElementById(targetId);
    display.innerHTML = "読み込み中...";
    try {
        const q = query(
            collection(db, "rankings"), 
            where("unit", "==", currentUnit), 
            orderBy("score", "desc"), 
            limit(5)
        );
        const snap = await getDocs(q);
        let html = "";
        if (snap.empty) {
            html = "<p>データがまだありません。</p>";
        } else {
            snap.forEach(doc => {
                const d = doc.data();
                html += `<div class="ranking-item"><span>${d.name}</span><span>${d.score}点</span></div>`;
            });
        }
        display.innerHTML = html;
    } catch (err) {
        console.error(err);
        display.innerHTML = "ランキングの取得に失敗しました。";
    }
}
