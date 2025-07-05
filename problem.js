// problem.js (TSV読み込み + 数式整形 対応版)

let allProblems = [];
let currentProblems = [];
let currentProblemIndex = 0;

// --- HTML要素の取得 ---
const questionNumberEl = document.getElementById('question-number');
const questionTagsEl = document.getElementById('question-tags');
const questionTextEl = document.getElementById('question-text');
const choicesContainer = document.getElementById('choices-container');
const feedbackContainer = document.getElementById('feedback-container');
const nextButton = document.getElementById('next-button');

// --- 数式を整形する専門家 (変更なし) ---
function formatMathExpression(text) {
    if (!text) return '';
    let formatted = text.toString();
    formatted = formatted.replace(/\^(\d+)/g, '<sup>$1</sup>');
    formatted = formatted.replace(/(\w+|\(.+?\))\s*\/\s*(\w+|\d+)/g, '\\(\\frac{$1}{$2}\\)');
    return formatted;
}

// ★★★ TSVを解析する専門家 (新登場！) ★★★
function parseTSV(text) {
    const lines = text.trim().split('\n');
    const header = lines.shift().split('\t'); // タブで分割
    
    return lines.map(line => {
        const values = line.split('\t'); // タブで分割
        const entry = {};
        header.forEach((key, i) => {
            entry[key.trim()] = values[i] ? values[i].trim() : '';
        });
        return entry;
    });
}

// --- メイン処理 ---
async function init() {
    const params = new URLSearchParams(window.location.search);
    const tag = params.get('tag');

    // ★★★ TSVファイルを読み込むように変更 ★★★
    await loadProblemsFromTSV('math_problems.tsv');
    
    filterProblemsByTag(tag);
    displayProblem();
}

async function loadProblemsFromTSV(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error('TSVファイルが見つかりません。');
        const tsvText = await response.text();
        allProblems = parseTSV(tsvText).map(p => ({
            ...p,
            choices: [p.choice1, p.choice2, p.choice3, p.choice4],
            correct: parseInt(p.correct_answer_num),
            // タグは半角スペース区切りを想定
            tags: p.tags ? p.tags.split(' ') : []
        }));
    } catch (error) {
        console.error('問題の読み込みに失敗:', error);
        questionTextEl.innerHTML = `<p style="color: red;">問題の読み込みに失敗しました: ${error.message}</p>`;
    }
}

// --- これより下の関数は、CSV版と全く同じです ---

function filterProblemsByTag(tag) {
    if (!tag) {
        currentProblems = [];
        return;
    }
    if (tag === 'random10') {
        currentProblems = [...allProblems].sort(() => 0.5 - Math.random()).slice(0, 10);
    } else {
        currentProblems = allProblems.filter(p => p.tags && p.tags.includes(tag));
    }
    currentProblemIndex = 0;
}

function displayProblem() {
    if (currentProblemIndex >= currentProblems.length) {
        questionTextEl.innerHTML = '<h1>🎉 全問終了！お疲れ様でした！</h1>';
        choicesContainer.innerHTML = '';
        feedbackContainer.innerHTML = '';
        nextButton.style.display = 'none';
        return;
    }
    const p = currentProblems[currentProblemIndex];
    if (!p) return;
    questionNumberEl.textContent = `Q.${currentProblemIndex + 1}`;
    questionTagsEl.textContent = p.tags ? p.tags.join(' / ') : '';
    questionTextEl.innerHTML = formatMathExpression(p.question_text);
    choicesContainer.innerHTML = '';
    p.choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.className = 'choice-button';
        button.innerHTML = formatMathExpression(choice);
        button.dataset.index = index + 1;
        button.addEventListener('click', handleChoiceClick);
        choicesContainer.appendChild(button);
    });
    if (typeof MathJax !== 'undefined') {
        MathJax.typesetPromise();
    }
    feedbackContainer.innerHTML = '';
    nextButton.style.display = 'none';
}

function handleChoiceClick(event) {
    const selectedIndex = parseInt(event.currentTarget.dataset.index);
    const correctIndex = currentProblems[currentProblemIndex].correct;
    Array.from(choicesContainer.children).forEach(btn => {
        btn.disabled = true;
        if (parseInt(btn.dataset.index) !== correctIndex) {
            btn.style.opacity = '0.5';
        }
    });
    if (selectedIndex === correctIndex) {
        feedbackContainer.innerHTML = '<span class="feedback-correct">正解！</span>';
        event.currentTarget.classList.add('correct');
    } else {
        feedbackContainer.innerHTML = `<span class="feedback-incorrect">不正解... 答えは ${correctIndex} 番です。</span>`;
        event.currentTarget.classList.add('incorrect');
        choicesContainer.querySelector(`[data-index='${correctIndex}']`).classList.add('correct-highlight');
    }
    nextButton.style.display = 'block';
}

nextButton.addEventListener('click', () => {
    currentProblemIndex++;
    displayProblem();
});

// ページが読み込まれたら実行
init();