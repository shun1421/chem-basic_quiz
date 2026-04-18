import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, where } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { quizData } from './questions.js';

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
let sessionQuestions = [];
let currentIndex = 0;
let score = 0;
let combo = 0;
let timer;
let timeLeft = 15;

// 初期化：単元ボタンの生成
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

// 配列をランダムに並び替える関数（Fisher-Yatesシャッフル）
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function startQuiz(unit) {
    // 10問をランダムに抽出する（全問題からシャッフルして最初の10問を取る）
    const allQuestions = [...quizData[unit]];
    sessionQuestions = shuffle(allQuestions).slice(0, 10);
    
    currentIndex = 0;
    score = 0;
    combo = 0;
    document.getElementById("home-screen").classList.add("hidden");
    document.getElementById("quiz-screen").classList.remove("hidden");
    showQuestion();
}

function showQuestion() {
    if (currentIndex >= sessionQuestions.length) return endQuiz();
    
    const data = sessionQuestions[currentIndex];
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
    timeLeft = 15;
    document.getElementById("timer-bar").style.width = "100%";
    clearInterval(timer);
    timer = setInterval(() => {
        timeLeft -= 0.1;
        document.getElementById("timer-bar").style.width = (timeLeft / 15 * 100) + "%";
        if (timeLeft <= 0) checkAnswer(-1); // 時間切れ
    }, 100);
}

function checkAnswer(idx) {
    clearInterval(timer);
    const correct = sessionQuestions[currentIndex].correct;
    const buttons = document.getElementById("answer-buttons").querySelectorAll("button");
    
    // 全ボタンを無効化し，色をつける
    buttons.forEach((btn, i) => {
        btn.disabled = true; // 連続クリック防止
        if (i === correct) {
            btn.classList.add("correct"); // 正解は常に緑
        } else if (i === idx) {
            btn.classList.add("incorrect"); // 間違えて選んだボタンは赤
        }
    });

    if (idx === correct) {
        combo++;
        score += 100 + (combo * 5) + Math.floor(timeLeft * 2);
    } else {
        combo = 0;
    }
    
    document.getElementById("score-display").innerText = `Score: ${score}`;
    document.getElementById("combo-display").innerText = `Combo: ${combo}`;
    
    currentIndex++;
    // 色を確認できるよう，少し待ってから次の問題へ
    setTimeout(showQuestion, 1200);
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
            limit(10)
        );
        const snap = await getDocs(q);
        let html = "";
        if (snap.empty) {
            html = "<p>データがまだありません。</p>";
        } else {
            let rank = 1;
            snap.forEach(doc => {
                const d = doc.data();
                html += `
                    <div class="ranking-item">
                        <span>${rank}. </span>
                        <div class="ranking-info">
                            <span class="ranking-school">${d.school || "不明"}</span>
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
