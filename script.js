let allQuestions = [];
let currentQuestions = [];
let score = 0;
let combo = 0;

// 1. データを読み込む
fetch('questions.json')
    .then(response => response.json())
    .then(data => {
        allQuestions = data;
    });

// 2. クイズ開始
function startQuiz(unit) {
    document.getElementById('unit-selector').style.display = 'none';
    document.getElementById('quiz-area').style.display = 'block';
    
    // 単元で絞り込み
    if (unit === 'all') {
        currentQuestions = [...allQuestions].sort(() => Math.random() - 0.5);
    } else {
        currentQuestions = allQuestions.filter(q => q.unit === unit);
    }
    
    showNextQuestion();
}

// 3. 問題を表示
function showNextQuestion() {
    if (currentQuestions.length === 0) {
        alert(`終了！最終スコア: ${score}`);
        location.reload();
        return;
    }
    
    const q = currentQuestions.shift();
    document.getElementById('question-text').textContent = q.question;
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    
    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.textContent = opt;
        btn.onclick = () => checkAnswer(opt, q.answer);
        container.appendChild(btn);
    });
}

// 4. 正誤判定と得点計算
function checkAnswer(selected, correct) {
    if (selected === correct) {
        combo++;
        score += 100 * combo; // コンボで加算
        document.getElementById('message').textContent = "正解！";
    } else {
        combo = 0;
        document.getElementById('message').textContent = "不正解...";
    }
    document.getElementById('score').textContent = score;
    document.getElementById('combo').textContent = combo;
    
    setTimeout(showNextQuestion, 1000);
}