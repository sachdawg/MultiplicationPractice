// script.js

// DOM Elements
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultsScreen = document.getElementById('results-screen');
const maxNumberInput = document.getElementById('max-number');
const startBtn = document.getElementById('start-btn');
const timerElement = document.getElementById('timer');
const num1Element = document.getElementById('num1');
const num2Element = document.getElementById('num2');
const answerInput = document.getElementById('answer');
const feedbackElement = document.getElementById('feedback');
const questionCountElement = document.getElementById('question-count');
const scoreElement = document.getElementById('score');
const accuracyElement = document.getElementById('accuracy');
const restartBtn = document.getElementById('restart-btn');

// Game variables
let maxNumber = 12;
let timeLeft = 60;
let timer;
let score = 0;
let totalQuestions = 0;
let currentAnswer = 0;
let questionHistory = [];

// Initialize the app
function init() {
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', resetGame);
    answerInput.addEventListener('input', checkAnswer);
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
    score = 0;
    totalQuestions = 0;
    questionCountElement.textContent = totalQuestions;
    timerElement.textContent = timeLeft;
    feedbackElement.textContent = '';
    feedbackElement.className = 'feedback';
    answerInput.value = '';
    
    // Start timer
    timer = setInterval(updateTimer, 1000);
    
    // Generate first question
    generateQuestion();
    
    // Focus on answer input
    answerInput.focus();
}

// Update the timer
function updateTimer() {
    timeLeft--;
    timerElement.textContent = timeLeft;
    
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
    
    // Clear input and feedback
    answerInput.value = '';
    feedbackElement.textContent = '';
    feedbackElement.className = 'feedback';
    
    // Add to question history
    questionHistory.push(`${num1} × ${num2}`);
    totalQuestions++;
    questionCountElement.textContent = totalQuestions;
}

// Check the answer
function checkAnswer() {
    const userAnswer = parseInt(answerInput.value);
    
    if (isNaN(userAnswer)) return;
    
    if (userAnswer === currentAnswer) {
        // Correct answer
        score++;
        feedbackElement.textContent = 'Correct!';
        feedbackElement.className = 'feedback correct';
        
        // Move to next question after a short delay
        setTimeout(() => {
            if (timeLeft > 0) {
                generateQuestion();
                answerInput.focus();
            }
        }, 500);
    } else if (userAnswer.toString().length >= currentAnswer.toString().length) {
        // Wrong answer and user has entered enough digits
        feedbackElement.textContent = `Incorrect! ${num1Element.textContent} × ${num2Element.textContent} = ${currentAnswer}`;
        feedbackElement.className = 'feedback incorrect';
        
        // Move to next question after a short delay
        setTimeout(() => {
            if (timeLeft > 0) {
                generateQuestion();
                answerInput.focus();
            }
        }, 1000);
    }
}

// End the game
function endGame() {
    clearInterval(timer);
    
    // Switch to results screen
    quizScreen.classList.add('hidden');
    resultsScreen.classList.remove('hidden');
    
    // Calculate and display results
    scoreElement.textContent = score;
    const accuracy = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    accuracyElement.textContent = accuracy;
}

// Reset the game
function resetGame() {
    resultsScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    questionHistory = [];
    answerInput.blur();
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', init);