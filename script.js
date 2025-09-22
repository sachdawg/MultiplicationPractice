// script.js

// DOM Elements
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultsScreen = document.getElementById('results-screen');
const maxNumberInput = document.getElementById('max-number');
const startBtn = document.getElementById('start-btn');
// new dec/inc buttons
const decMaxBtn = document.getElementById('dec-max');
const incMaxBtn = document.getElementById('inc-max');
const timerElement = document.getElementById('timer');
const timerProgress = document.querySelector('.timer-progress');
const num1Element = document.getElementById('num1');
const num2Element = document.getElementById('num2');
const answerInput = document.getElementById('answer');
const feedbackElement = document.getElementById('feedback');
const questionCountElement = document.getElementById('question-count');
const scoreElement = document.getElementById('score');
const highestScoreElement = document.getElementById('highest-score');
// accuracyElement removed
const restartBtn = document.getElementById('restart-btn');
const scoreChartCanvas = document.getElementById('score-chart');

// Game variables
let maxNumber = 12;
// timer default changed to 60
let timeLeft = 60;
let totalTime = 60;
let timer;
let score = 0;
let totalQuestions = 0;
let currentAnswer = 0;
let questionHistory = [];
let scoreHistory = JSON.parse(localStorage.getItem('multiplicationScoreHistory')) || [];
let chart = null;
// track last shown question to avoid immediate repeats
let lastQuestion = null;

// Initialize the app
function init() {
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', resetGame);
    // bind clear data button (may be null if DOM changed)
    const clearDataBtn = document.getElementById('clear-data-btn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', handleClearData);
    }
    answerInput.addEventListener('input', checkAnswer);
    
    // wire up increment/decrement buttons
    decMaxBtn.addEventListener('click', () => {
        let v = parseInt(maxNumberInput.value) || 1;
        v = Math.max(1, v - 1);
        maxNumberInput.value = v;
    });
    incMaxBtn.addEventListener('click', () => {
        let v = parseInt(maxNumberInput.value) || 1;
        v = Math.min(20, v + 1);
        maxNumberInput.value = v;
    });

    // Prevent blur on mobile to keep keyboard active
    answerInput.addEventListener('blur', () => {
        setTimeout(() => answerInput.focus(), 0);
    });
    
    // Handle touch events to prevent blur on mobile
    document.addEventListener('touchstart', (e) => {
        if (!answerInput.contains(e.target) && quizScreen.classList.contains('hidden') === false) {
            e.preventDefault();
            answerInput.focus();
        }
    }, { passive: false });
    
    // Set the initial circumference for the timer
    const radius = timerProgress.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    timerProgress.style.strokeDasharray = `${circumference} ${circumference}`;
    timerProgress.style.strokeDashoffset = circumference;
}

// Start the game
function startGame() {
    maxNumber = parseInt(maxNumberInput.value) || 12;
    if (maxNumber < 1) maxNumber = 1;
    if (maxNumber > 20) maxNumber = 20;
    
    // Switch to quiz screen
    startScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');
    
    // Reset game state
    timeLeft = 60;
    totalTime = 60;
    score = 0;
    totalQuestions = 0;
    questionHistory = [];
    questionCountElement.textContent = totalQuestions;
    timerElement.textContent = timeLeft;
    updateTimerDisplay();
    feedbackElement.textContent = '';
    feedbackElement.className = 'feedback';
    answerInput.value = '';
    
    // Start timer
    timer = setInterval(updateTimer, 1000);
    
    // Generate first question
    generateQuestion();
    
    // Ensure focus
    answerInput.focus();
}

// Update the visual timer
function updateTimerDisplay() {
    const radius = timerProgress.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (timeLeft / totalTime) * circumference;
    timerProgress.style.strokeDashoffset = offset;
}

// Update the timer
function updateTimer() {
    timeLeft--;
    timerElement.textContent = timeLeft;
    updateTimerDisplay();
    
    if (timeLeft <= 0) {
        endGame();
    }
}

// New: pick a question pair so that groups with max value k get probabilities 1/2, 1/4, 1/8, ...
function chooseQuestionPair() {
    const n = maxNumber;
    if (n <= 1) return [1, 1];

    // Create all possible question pairs with their weights
    const questions = [];
    let totalWeight = 0;
    
    // For each times table from 1 to n
    for (let k = 1; k <= n; k++) {
        // Weight for this times table: 1/2^((n-k)+1)
        // For n=12: k=12 gets weight 1/2, k=11 gets weight 1/4, etc.
        const weight = 1 / Math.pow(2, (n - k) + 1);
        
        // Add each possible question in this times table
        for (let i = 1; i <= k; i++) {
            questions.push({
                num1: k,
                num2: i,
                weight: weight
            });
            totalWeight += weight;
        }
    }
    
    // Select a question based on weights
    let random = Math.random() * totalWeight;
    let cumulativeWeight = 0;
    
    for (const question of questions) {
        cumulativeWeight += question.weight;
        if (random <= cumulativeWeight) {
            // Randomize the order so k isn't always shown first
            if (Math.random() < 0.5) {
                return [question.num1, question.num2];
            } else {
                return [question.num2, question.num1];
            }
        }
    }
    
    // Fallback (should never reach here)
    const fallbackK = Math.floor(Math.random() * n) + 1;
    const fallbackOther = Math.floor(Math.random() * fallbackK) + 1;
    if (Math.random() < 0.5) {
        return [fallbackK, fallbackOther];
    } else {
        return [fallbackOther, fallbackK];
    }
}

// Generate a multiplication question with weighted distribution
function generateQuestion() {
    // Select a question pair using the new distribution
    let [num1, num2] = chooseQuestionPair();

    // avoid repeating the exact same displayed question twice in a row
    let questionKey = `${num1}×${num2}`;
    let attempts = 0;
    while (lastQuestion !== null && questionKey === lastQuestion && attempts < 10) {
        [num1, num2] = chooseQuestionPair();
        questionKey = `${num1}×${num2}`;
        attempts++;
    }
    lastQuestion = questionKey;
    
    // Update display
    num1Element.textContent = num1;
    num2Element.textContent = num2;
    currentAnswer = num1 * num2;
    
    // Clear input value (but keep focus)
    answerInput.value = '';
    
    // Show brief correct feedback if it was the previous question
    if (feedbackElement.textContent === 'Correct!') {
        // Feedback already shown for previous correct answer
        setTimeout(() => {
            feedbackElement.textContent = '';
            feedbackElement.className = 'feedback';
        }, 500);
    }
    
    // Add to question history
    questionHistory.push(`${num1} × ${num2}`);
    totalQuestions++;
    questionCountElement.textContent = totalQuestions;
    
    // Ensure focus remains
    answerInput.focus();
}

// Check answer on input (only react to correct)
function checkAnswer() {
    const userAnswer = parseInt(answerInput.value);
    
    if (isNaN(userAnswer)) return; // Ignore invalid input
    
    if (userAnswer === currentAnswer) {
        // Correct answer - instantaneous next question
        score++;
        feedbackElement.textContent = 'Correct!';
        feedbackElement.className = 'feedback correct';
        
        // Immediately generate next question
        generateQuestion();
    }
    // No action for incorrect - user must continue typing the correct answer
}

// End the game
function endGame() {
    clearInterval(timer);
    
    // Update score history
    scoreHistory.push(score);
    localStorage.setItem('multiplicationScoreHistory', JSON.stringify(scoreHistory));
    
    // Calculate highest score
    const highestScore = Math.max(...scoreHistory, 0);
    
    // Switch to results screen
    quizScreen.classList.add('hidden');
    resultsScreen.classList.remove('hidden');
    
    // Display results
    scoreElement.textContent = score;
    highestScoreElement.textContent = highestScore;
    // accuracy removed per request
    
    // Create line chart
    createScoreChart();
}

// Create the line chart for score history
function createScoreChart() {
    const ctx = scoreChartCanvas.getContext('2d');
    
    if (chart) {
        chart.destroy();
    }
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: scoreHistory.map((_, index) => `Session ${index + 1}`),
            datasets: [{
                label: 'Scores Over Time',
                data: scoreHistory,
                borderColor: '#2575fc',
                backgroundColor: 'rgba(37, 117, 252, 0.2)',
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// New: handle clear saved scores (confirmation + clear)
function handleClearData() {
    const ok = window.confirm('Are you sure you want to permanently delete all saved scores? This cannot be undone.');
    if (!ok) return;
    // Clear storage and in-memory data
    localStorage.removeItem('multiplicationScoreHistory');
    scoreHistory = [];
    // Update UI
    highestScoreElement.textContent = '0';
    // refresh chart if visible
    if (chart) {
        chart.destroy();
        chart = null;
    }
    // recreate (will show empty data)
    createScoreChart();
    // optionally provide quick feedback
    alert('Saved scores cleared.');
}

// Reset the game
function resetGame() {
    resultsScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    if (chart) {
        chart.destroy();
        chart = null;
    }
    answerInput.blur();
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', init);