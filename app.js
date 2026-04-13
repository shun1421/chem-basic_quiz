import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, where } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { quizData } from './questions.js';

// 【ここに以前取得したご自身の設定情報を貼り付けてください】
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

const unitContainer = document.getElementById("unit-buttons");
Object.keys(quizData).forEach(unit => {
    const btn = document.createElement("button");
    btn.innerText = unit;
    btn.onclick = () => selectUnit(unit);
    unitContainer.appendChild(btn);
});

function selectUnit(unit) {
    currentUnit = unit;
    document.getElementById("ranking-title").innerText = `${unit} のTOP 10`;
    document.getElementById("home-ranking-area").classList.remove("hidden");
    showRanking("home-ranking-list");
}

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

document.getElementById("save-button").onclick = async () => {
    const schoolName = document.getElementById("school-name").value || "不明";
    const playerName = document.getElementById("player-name").value || "匿名希望";
    
    const btn = document.getElementById("save-button");
    btn.disabled = true;
    btn.innerText = "保存中...";
    
    try {
        await addDoc(collection(db, "rankings"), {
            school: schoolName,
            name: playerName,
            unit: currentUnit,
            score: score,
            date: new Date()
        });
        alert("ランキングに登録しました！");
        await showRanking("result-ranking-list");
    } catch (e) {
        console.error(e);
        alert("保存に失敗しました。");
        btn.disabled = false;
        btn.innerText = "ランキングに登録";
    } finally {
        btn.innerText = "登録完了";
    }
};

async function showRanking(targetId) {
    const display = document.getElementById(targetId);
    display.innerHTML = "読み込み中...";
    try {
        const q = query(
            collection(db, "rankings"), 
            where("unit", "==", currentUnit), 
            orderBy("score", "desc"), 
            limit(10) // ここを10に変更
        );
        const snap = await getDocs(q);
        let html = "";
        if (snap.empty) {
            html = "<p>データがまだありません。</p>";
        } else {
            let rank = 1;
            snap.forEach(doc => {
                const d = doc.data();
                const school = d.school || "不明";
                html += `
                    <div class="ranking-item">
                        <span>${rank}. </span>
                        <div class="ranking-info">
                            <span class="ranking-school">${school}</span>
                            <span class="ranking-name">${d.name}</span>
                        </div>
                        <span class="ranking-score">${d.score}点</span>
                    </div>`;
                rank++;
            });
        }
        display.innerHTML = html;
    } catch (err) {
        console.error(err);
        display.innerHTML = "ランキングの取得に失敗しました。";
    }
}
