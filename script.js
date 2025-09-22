// script.js

// DOM Elements
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultsScreen = document.getElementById('results-screen');
const maxNumberInput = document.getElementById('max-number');
const startBtn = document.getElementById('start-btn');
const timerElement = document.getElementById('timer');
const timerProgress = document.querySelector('.timer-progress');
const num1Element = document.getElementById('num1');
const num2Element = document.getElementById('num2');
const answerInput = document.getElementById('answer');
const feedbackElement = document.getElementById('feedback');
const questionCountElement = document.getElementById('question-count');
const scoreElement = document.getElementById('score');
const highestScoreElement = document.getElementById('highest-score');
const accuracyElement = document.getElementById('accuracy');
const restartBtn = document.getElementById('restart-btn');
const scoreChartCanvas = document.getElementById('score-chart');

// Game variables
let maxNumber = 12;
let timeLeft = 60;
let totalTime = 60;
let timer;
let score = 0;
let totalQuestions = 0;
let currentAnswer = 0;
let questionHistory = [];
let scoreHistory = JSON.parse(localStorage.getItem('multiplicationScoreHistory')) || [];
let chart = null;

// Initialize the app
function init() {
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', resetGame);
    answerInput.addEventListener('input', checkAnswer);
    
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

// Generate a multiplication question with weighted distribution
function generateQuestion() {
    // Create weighted array where higher numbers appear more frequently
    let numbers = [];
    for (let i = 1; i <= maxNumber; i++) {
        // Add each number 'i' times to the array
        for (let j = 0; j < i; j++) {
            numbers.push(i);
        }
    }
    
    // Select two random numbers from the weighted array
    const num1 = numbers[Math.floor(Math.random() * numbers.length)];
    const num2 = numbers[Math.floor(Math.random() * numbers.length)];
    
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
    const accuracy = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    accuracyElement.textContent = accuracy;
    
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