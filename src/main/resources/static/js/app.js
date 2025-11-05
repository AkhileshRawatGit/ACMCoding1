const API_BASE_URL =
  window.location.hostname === "localhost" ? "http://localhost:8080/api" : `${window.location.origin}/api`
let currentUser = null
let currentQuestion = null
let codeEditor = null
const CodeMirror = window.CodeMirror
let filteredQuestions = []
let allQuestions = []

const codeDrafts = {}

const languageBoilerplates = {
  71: `# Python Solution
def solve():
    # Write your solution here
    pass

if __name__ == "__main__":
    solve()`,

  62: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your solution here

        sc.close();
    }
}`,

  54: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    // Write your solution here

    return 0;
}`,

  50: `#include <stdio.h>
#include <stdlib.h>

int main() {
    // Write your solution here

    return 0;
}`,

  63: `// JavaScript Solution
function solve() {
    // Write your solution here
}

solve();`,
}

// Timer and Tab Switch
let timerInterval
let timeLeft = 600 // 10 min = 600 sec
let autoSubmitted = false

function startTimerOnce() {
  if (currentUser.role !== "PARTICIPANT") return // Only for participants
  if (timerInterval) return // Already started, so do nothing

  timeLeft = 7200 // 2 hours in seconds
  updateTimerDisplay()

  timerInterval = setInterval(() => {
    timeLeft--
    updateTimerDisplay()
    if (timeLeft <= 0) {
      clearInterval(timerInterval)
      autoSubmitTest("Time's up! Auto-submitting...")
    }
  }, 1000)
}

function startTimer() {
  if (currentUser.role !== "PARTICIPANT") return // Only for participants

  clearInterval(timerInterval)
  timeLeft = 7200 // 2 hours in seconds
  updateTimerDisplay()

  timerInterval = setInterval(() => {
    timeLeft--
    updateTimerDisplay()
    if (timeLeft <= 0) {
      clearInterval(timerInterval)
      autoSubmitTest("Time's up! Auto-submitting...")
    }
  }, 1000)
}

function updateTimerDisplay() {
  const hours = Math.floor(timeLeft / 3600)
  const minutes = Math.floor((timeLeft % 3600) / 60)
  const seconds = timeLeft % 60

  const timerEl = document.getElementById("timerDisplay")
  if (timerEl) {
    timerEl.textContent = `Time Left: ${hours}:${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`
  }
}

function autoSubmitTest(message) {
  if (autoSubmitted) return
  autoSubmitted = true
  showNotification(message, "info")

  // Trigger final submission without confirmation
  const loadingSpinner = document.getElementById("loadingSpinner")
  const loadingMessage = document.getElementById("loadingMessage")
  loadingSpinner.classList.remove("hidden")
  loadingSpinner.classList.add("flex")
  loadingMessage.textContent = "Auto-submitting your test due to: " + message

  fetch(`${API_BASE_URL}/participant/submit-all`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      return response.json()
    })
    .then((result) => {
      loadingSpinner.classList.add("hidden")
      document.getElementById("submissionSuccessScreen").classList.remove("hidden")

      // Auto logout after 3 seconds
      setTimeout(() => handleLogout(), 3000)
    })
    .catch((error) => {
      console.error("[v0] Auto-submit error:", error)
      loadingSpinner.classList.add("hidden")
      showNotification("Error during auto-submission: " + error.message, "error")
      // Force logout anyway after error
      setTimeout(() => handleLogout(), 2000)
    })
}

// Tab switch detection
document.addEventListener("visibilitychange", () => {
  if (currentUser?.role === "PARTICIPANT" && document.hidden && !autoSubmitted) {
    autoSubmitTest("Tab switched! Auto-submitting your test...")
  }
})

window.addEventListener("blur", () => {
  if (
    currentUser?.role === "PARTICIPANT" &&
    !autoSubmitted &&
    document.getElementById("codingInterface").classList.contains("hidden") === false
  ) {
    autoSubmitTest("Window switched! Auto-submitting your test...")
  }
})

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
  setupEventListeners()
})

// Add notification function
function showNotification(message, type = "success") {
  const notification = document.getElementById("notification")
  const notificationText = document.getElementById("notificationText")
  const icon = notification.querySelector("i")

  notificationText.textContent = message

  // Update colors based on type
  const borderColor = type === "success" ? "border-green-500" : type === "error" ? "border-red-500" : "border-blue-500"
  const iconColor = type === "success" ? "text-green-500" : type === "error" ? "text-red-500" : "text-blue-500"
  const iconClass =
    type === "success" ? "fa-check-circle" : type === "error" ? "fa-exclamation-circle" : "fa-info-circle"

  notification.querySelector(".bg-white").className = `bg-white rounded-lg shadow-lg p-4 border-l-4 ${borderColor}`
  icon.className = `fas ${iconClass} ${iconColor} mr-3`

  notification.classList.add("show")

  setTimeout(() => {
    notification.classList.remove("show")
  }, 3000)
}

const jwtToken = () => localStorage.getItem("token")

function initializeApp() {
  const storedUser = localStorage.getItem("user")
  if (jwtToken() && storedUser) {
    currentUser = JSON.parse(storedUser)
    showDashboard()
  } else {
    showAuthScreen()
  }
}

// The 'user' variable was undeclared. Assuming it should be fetched from localStorage or passed in.
// For now, we'll check if currentUser is already set or try to load it.

function setupEventListeners() {
  // Auth tabs
  document.getElementById("loginTab").addEventListener("click", () => switchTab("login"))
  document.getElementById("registerTab").addEventListener("click", () => switchTab("register"))

  // Auth forms
  document.getElementById("loginForm").addEventListener("submit", handleLogin)
  document.getElementById("registerForm").addEventListener("submit", handleRegister)

  // Navigation
  document.getElementById("logoutBtn").addEventListener("click", handleLogout)

  // Admin functions
  document.getElementById("addQuestionBtn")?.addEventListener("click", () => openQuestionModal())
  document.getElementById("closeModal")?.addEventListener("click", closeQuestionModal)
  document.getElementById("cancelBtn")?.addEventListener("click", closeQuestionModal)
  document.getElementById("questionForm")?.addEventListener("submit", handleQuestionSubmit)
  document.getElementById("addTestCaseBtn")?.addEventListener("click", addTestCaseRow)
  document.getElementById("addParameterBtn")?.addEventListener("click", addParameterRow) // New event listener

  // Coding interface
  document.getElementById("backToQuestions")?.addEventListener("click", backToParticipantDashboard)
  document.getElementById("compileBtn")?.addEventListener("click", () => runCode("compile"))
  document.getElementById("runBtn")?.addEventListener("click", () => runCode("run"))
  document.getElementById("submitBtn")?.addEventListener("click", () => runCode("submit"))
  document.getElementById("languageSelect")?.addEventListener("change", updateEditorMode)
  // Event listener for submit all
  document.getElementById("submitAllBtn")?.addEventListener("click", submitAllQuestions)

  // Setup search and filter
  setupSearchAndFilter()

  // Start test button on instruction screen
  document.getElementById("startTestBtn")?.addEventListener("click", startTest)
}

// Auth Functions
function switchTab(tab) {
  const loginTab = document.getElementById("loginTab")
  const registerTab = document.getElementById("registerTab")
  const loginForm = document.getElementById("loginForm")
  const registerForm = document.getElementById("registerForm")

  if (tab === "login") {
    loginTab.classList.add("border-blue-500", "text-blue-500")
    loginTab.classList.remove("text-gray-500")
    registerTab.classList.add("text-gray-500")
    registerTab.classList.remove("border-blue-500", "text-blue-500")
    loginForm.classList.remove("hidden")
    registerForm.classList.add("hidden")
  } else {
    registerTab.classList.add("border-blue-500", "text-blue-500")
    registerTab.classList.remove("text-gray-500")
    loginTab.classList.add("text-gray-500")
    loginTab.classList.remove("border-blue-500", "text-blue-500")
    registerForm.classList.remove("hidden")
    loginForm.classList.add("hidden")
  }
}

async function handleLogin(e) {
  e.preventDefault()
  const username = document.getElementById("loginUsername").value
  const password = document.getElementById("loginPassword").value

  console.log("[v0] Attempting login")
  showLoading(true)

  try {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })

    console.log("[v0] Login response status:", response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Login failed" }))
      showNotification(errorData.message || "Login failed. Please check your credentials.", "error")
      return
    }

    const data = await response.json()

    if (!data.accessToken || !data.user) {
      showNotification("Login failed: Invalid response from server", "error")
      return
    }

    localStorage.clear()
    localStorage.setItem("token", data.accessToken)
    localStorage.setItem("user", JSON.stringify(data.user))
    currentUser = data.user

    console.log("[v0] Login successful, role:", currentUser.role)
    showNotification(`Welcome back, ${data.user.username}!`, "success")

    setTimeout(() => showDashboard(), 500)
  } catch (error) {
    console.error("[v0] Login error:", error)
    showNotification("Login failed: " + error.message, "error")
  } finally {
    showLoading(false)
  }
}

async function handleRegister(e) {
  e.preventDefault()
  const username = document.getElementById("registerUsername").value
  const email = document.getElementById("registerEmail").value
  const password = document.getElementById("registerPassword").value
  const role = document.getElementById("registerRole").value

  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, role }),
    })

    const data = await response.json()

    if (response.ok) {
      alert("Registration successful! Please login.")
      switchTab("login")
    } else {
      alert(data.message || "Registration failed")
    }
  } catch (error) {
    alert("Registration failed: " + error.message)
  }
}

function handleLogout() {
  console.log("[v0] Logging out")

  // Clear all storage
  localStorage.clear()

  // Reset all state
  currentUser = null
  currentQuestion = null
  allQuestions = []
  filteredQuestions = []

  // Clear timer
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  timeLeft = 7200
  autoSubmitted = false

  // Reset code editor
  if (codeEditor) {
    codeEditor.setValue("")
  }

  // Show auth screen
  showAuthScreen()
  showNotification("Logged out successfully", "success")
}

// Screen Management
function showAuthScreen() {
  document.getElementById("authScreen").classList.remove("hidden")
  document.getElementById("navbar").classList.add("hidden")
  document.getElementById("adminDashboard").classList.add("hidden")
  document.getElementById("participantDashboard").classList.add("hidden")
  document.getElementById("codingInterface").classList.add("hidden")
  document.getElementById("instructionScreen").classList.add("hidden") // Hide instruction screen on logout
  document.getElementById("submissionSuccessScreen").classList.add("hidden") // Hide submission success screen on logout
}

function showDashboard() {
  document.getElementById("authScreen").classList.add("hidden")
  document.getElementById("navbar").classList.remove("hidden")
  document.getElementById("userInfo").textContent = `${currentUser.username} (${currentUser.role})`

  const timerDisplay = document.getElementById("timerDisplay")
  if (currentUser.role === "ADMIN") {
    if (timerDisplay) {
      timerDisplay.classList.add("hidden")
    }
    document.getElementById("adminDashboard").classList.remove("hidden")
    document.getElementById("participantDashboard").classList.add("hidden")
    document.getElementById("codingInterface").classList.add("hidden")
    document.getElementById("instructionScreen").classList.add("hidden")
    loadAdminQuestions().then(() => {
      setupSearchAndFilter()
    })
    loadLeaderboard()
  } else {
    if (timerDisplay) {
      timerDisplay.classList.remove("hidden")
    }
    document.getElementById("instructionScreen").classList.remove("hidden")
    document.getElementById("participantDashboard").classList.add("hidden")
    document.getElementById("adminDashboard").classList.add("hidden")
    document.getElementById("codingInterface").classList.add("hidden")
  }
}

function startTest() {
  document.getElementById("instructionScreen").classList.add("hidden")
  document.getElementById("participantDashboard").classList.remove("hidden")
  loadParticipantQuestions()
  startTimerOnce()
}

// Admin Functions
async function loadAdminQuestions() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/questions`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })

    if (!response.ok) {
      throw new Error("Failed to load questions")
    }

    const questions = await response.json()
    displayAdminQuestions(questions)
  } catch (error) {
    console.error("Error loading questions:", error)
    showNotification("Error loading questions. Please try again.", "error")
  }
}

// Update displayAdminQuestions function with enhanced UI
function displayAdminQuestions(questions) {
  allQuestions = questions
  filteredQuestions = questions

  // Update stats
  document.getElementById("totalQuestions").textContent = questions.length
  document.getElementById("easyQuestions").textContent = questions.filter((q) => q.difficulty === "EASY").length
  document.getElementById("hardQuestions").textContent = questions.filter((q) => q.difficulty === "HARD").length

  renderQuestionsList(filteredQuestions)
}

function renderQuestionsList(questions) {
  const container = document.getElementById("questionsList")
  container.innerHTML = ""

  if (questions.length === 0) {
    container.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <i class="fas fa-search text-4xl mb-4"></i>
                <p class="text-lg">No questions found</p>
                <p class="text-sm">Try adjusting your search or filter criteria</p>
            </div>
        `
    return
  }

  questions.forEach((question, index) => {
    const questionDiv = document.createElement("div")
    questionDiv.className = "bg-white border border-gray-200 rounded-xl p-6 card-hover animate-fade-in"
    questionDiv.style.animationDelay = `${index * 0.1}s`

    const difficultyClass =
      question.difficulty === "EASY"
        ? "difficulty-easy"
        : question.difficulty === "MEDIUM"
          ? "difficulty-medium"
          : "difficulty-hard"

    questionDiv.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center space-x-3 mb-3">
                        <h4 class="font-bold text-lg text-gray-800">${question.title}</h4>
                        <span class="px-3 py-1 text-xs rounded-full font-medium ${difficultyClass}">
                            ${question.difficulty}
                        </span>
                    </div>
                    <p class="text-gray-600 text-sm mb-4 leading-relaxed">${question.description.substring(0, 150)}...</p>
                    <div class="flex flex-wrap gap-2 mb-3">
                        <span class="inline-flex items-center px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            <i class="fas fa-keyboard mr-1"></i>
                            Input: ${question.inputFormatType.replace(/_/g, " ")}
                        </span>
                        <span class="inline-flex items-center px-3 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            <i class="fas fa-check-circle mr-1"></i>
                            Test Cases: ${question.testCases ? question.testCases.length : 0}
                        </span>
                    </div>
                    <div class="text-xs text-gray-500">
                        <i class="fas fa-info-circle mr-1"></i>
                        Complete solution required - write full program with input/output handling
                    </div>
                </div>
                <div class="flex space-x-2 ml-4">
                    <button onclick="editQuestion(${question.id})" class="btn-icon btn-edit" title="Edit Question">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteQuestion(${question.id})" class="btn-icon btn-delete" title="Delete Question">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `
    container.appendChild(questionDiv)
  })
}

function openQuestionModal(questionId = null) {
  document.getElementById("questionModal").classList.remove("hidden")
  document.getElementById("questionModal").classList.add("flex")

  // Reset form fields
  document.getElementById("questionForm").reset()
  document.getElementById("testCasesList").innerHTML = ""
  document.getElementById("parametersList").innerHTML = "" // Clear parameters
  addTestCaseRow() // Add one default test case
  addParameterRow() // Add one default parameter

  if (questionId) {
    document.getElementById("modalTitle").textContent = "Edit Question"
    loadQuestionForEdit(questionId)
  } else {
    document.getElementById("modalTitle").textContent = "Add New Question"
    // Set default values for new question
    document.getElementById("questionDifficulty").value = "EASY"
    document.getElementById("questionInputFormat").value = "TWO_INTEGERS"
    document.getElementById("questionReturnType").value = "INTEGER" // Default return type
  }
}

function closeQuestionModal() {
  document.getElementById("questionModal").classList.add("hidden")
  document.getElementById("questionModal").classList.remove("flex")
}

// Update addTestCaseRow function with enhanced UI
function addTestCaseRow() {
  const container = document.getElementById("testCasesList")
  const testCaseDiv = document.createElement("div")
  testCaseDiv.className = "bg-white border border-gray-200 rounded-lg p-4 animate-fade-in"
  testCaseDiv.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                    <i class="fas fa-keyboard mr-2"></i>Input
                </label>
                <textarea class="testcase-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" rows="3" placeholder="Enter test input..."></textarea>
            </div>
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                    <i class="fas fa-check-circle mr-2"></i>Expected Output
                </label>
                <textarea class="testcase-output w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" rows="3" placeholder="Enter expected output..." required></textarea>
            </div>
        </div>
        <div class="flex justify-between items-center">
            <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" class="testcase-public w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" checked>
                <span class="text-sm font-medium text-gray-700">
                    <i class="fas fa-eye mr-1"></i>Public Test Case
                </span>
            </label>
            <button type="button" onclick="this.parentElement.parentElement.remove()" class="text-red-600 hover:text-red-800 px-3 py-2 rounded-lg hover:bg-red-50 transition-all duration-300">
                <i class="fas fa-trash mr-1"></i>Remove
            </button>
        </div>
    `
  container.appendChild(testCaseDiv)
}

// Update addParameterRow function with enhanced UI
function addParameterRow(paramType = "INTEGER", paramName = "") {
  const container = document.getElementById("parametersList")
  const paramDiv = document.createElement("div")
  paramDiv.className = "flex items-center space-x-3 bg-white border border-gray-200 rounded-lg p-4 animate-fade-in"
  paramDiv.innerHTML = `
        <div class="flex-1">
            <select class="param-type w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm">
                <optgroup label="🔢 Basic Types">
                    <option value="INTEGER">Integer</option>
                    <option value="FLOAT">Float</option>
                    <option value="DOUBLE">Double</option>
                    <option value="CHAR">Character</option>
                    <option value="BOOLEAN">Boolean</option>
                    <option value="STRING">String</option>
                </optgroup>
                <optgroup label="📊 Array Types">
                    <option value="INTEGER_ARRAY">Integer Array</option>
                    <option value="FLOAT_ARRAY">Float Array</option>
                    <option value="DOUBLE_ARRAY">Double Array</option>
                    <option value="CHAR_ARRAY">Character Array</option>
                    <option value="STRING_ARRAY">String Array</option>
                    <option value="BOOLEAN_ARRAY">Boolean Array</option>
                </optgroup>
                <optgroup label="🚀 C++ Containers">
                    <option value="VECTOR_INT">vector&lt;int&gt;</option>
                    <option value="VECTOR_STRING">vector&lt;string&gt;</option>
                    <option value="VECTOR_DOUBLE">vector&lt;double&gt;</option>
                    <option value="VECTOR_FLOAT">vector&lt;float&gt;</option>
                    <option value="VECTOR_CHAR">vector&lt;char&gt;</option>
                    <option value="VECTOR_BOOL">vector&lt;bool&gt;</option>
                </optgroup>
                <optgroup label="🗺️ Map Types">
                    <option value="MAP_INT_INT">map&lt;int,int&gt;</option>
                    <option value="MAP_STRING_INT">map&lt;string,int&gt;</option>
                    <option value="MAP_INT_STRING">map&lt;int,string&gt;</option>
                    <option value="MAP_STRING_STRING">map&lt;string,string&gt;</option>
                    <option value="UNORDERED_MAP_INT_INT">unordered_map&lt;int,int&gt;</option>
                    <option value="UNORDERED_MAP_STRING_INT">unordered_map&lt;string,int&gt;</option>
                </optgroup>
                <optgroup label="📦 Set Types">
                    <option value="SET_INT">set&lt;int&gt;</option>
                    <option value="SET_STRING">set&lt;string&gt;</option>
                    <option value="UNORDERED_SET_INT">unordered_set&lt;int&gt;</option>
                    <option value="UNORDERED_SET_STRING">unordered_set&lt;string&gt;</option>
                </optgroup>
                <optgroup label="📚 Queue/Stack Types">
                    <option value="QUEUE_INT">queue&lt;int&gt;</option>
                    <option value="STACK_INT">stack&lt;int&gt;</option>
                    <option value="DEQUE_INT">deque&lt;int&gt;</option>
                    <option value="PRIORITY_QUEUE_INT">priority_queue&lt;int&gt;</option>
                </optgroup>
                <optgroup label="👫 Pair/Tuple Types">
                    <option value="PAIR_INT_INT">pair&lt;int,int&gt;</option>
                    <option value="PAIR_STRING_INT">pair&lt;string,int&gt;</option>
                    <option value="PAIR_INT_STRING">pair&lt;int,string&gt;</option>
                    <option value="PAIR_STRING_STRING">pair&lt;string,string&gt;</option>
                </optgroup>
                <optgroup label="🌳 LeetCode Types">
                    <option value="LISTNODE_PTR">ListNode*</option>
                    <option value="TREENODE_PTR">TreeNode*</option>
                </optgroup>
                <optgroup label="📋 Java/Python Lists">
                    <option value="LIST_INTEGER">List&lt;Integer&gt;</option>
                    <option value="LIST_STRING">List&lt;String&gt;</option>
                    <option value="LIST_DOUBLE">List&lt;Double&gt;</option>
                    <option value="LIST_FLOAT">List&lt;Float&gt;</option>
                    <option value="LIST_BOOLEAN">List&lt;Boolean&gt;</option>
                </optgroup>
            </select>
        </div>
        <div class="flex-1">
            <input type="text" class="param-name w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" placeholder="Parameter Name" value="${paramName}" required>
        </div>
        <button type="button" onclick="this.parentElement.remove()" class="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-300">
            <i class="fas fa-trash"></i>
        </button>
    `
  container.appendChild(paramDiv)

  // Set the selected type
  paramDiv.querySelector(".param-type").value = paramType
}

// Update handleQuestionSubmit with notification
async function handleQuestionSubmit(e) {
  e.preventDefault()

  const questionData = {
    title: document.getElementById("questionTitle").value,
    description: document.getElementById("questionDescription").value,
    difficulty: document.getElementById("questionDifficulty").value,
    inputFormatType: document.getElementById("questionInputFormat").value,
    parameters: [], // Initialize parameters array
    testCases: [],
  }

  // Collect parameters
  const parameterRows = document.querySelectorAll("#parametersList > div")
  parameterRows.forEach((row) => {
    const type = row.querySelector(".param-type").value
    const name = row.querySelector(".param-name").value
    if (type && name) {
      questionData.parameters.push({ type: type, name: name })
    }
  })

  // Collect test cases
  const testCaseRows = document.querySelectorAll("#testCasesList > div")
  testCaseRows.forEach((row) => {
    const input = row.querySelector(".testcase-input").value
    const output = row.querySelector(".testcase-output").value
    const isPublic = row.querySelector(".testcase-public").checked

    if (output.trim()) {
      questionData.testCases.push({
        input: input,
        expectedOutput: output,
        isPublic: isPublic,
      })
    }
  })

  try {
    showLoading(true)
    const questionId = document.getElementById("questionId").value
    const url = questionId ? `${API_BASE_URL}/admin/questions/${questionId}` : `${API_BASE_URL}/admin/questions`
    const method = questionId ? "PUT" : "POST"

    console.log("[v0] Sending question data:", questionData) // Debug log

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(questionData),
    })

    if (response.ok) {
      closeQuestionModal()
      loadAdminQuestions()
      showNotification(questionId ? "Question updated successfully!" : "Question created successfully!", "success")
    } else {
      const error = await response.text()
      console.log("[v0] Error response:", error) // Debug log
      showNotification("Error saving question: " + error, "error")
    }
  } catch (error) {
    console.log("[v0] Catch error:", error) // Debug log
    showNotification("Error saving question: " + error.message, "error")
  } finally {
    showLoading(false)
  }
}

// Add search and filter functionality
function setupSearchAndFilter() {
  const searchInput = document.getElementById("searchQuestions")
  const filterSelect = document.getElementById("filterDifficulty")

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      filterQuestions(e.target.value, filterSelect?.value || "")
    })
  }

  if (filterSelect) {
    filterSelect.addEventListener("change", (e) => {
      filterQuestions(searchInput?.value || "", e.target.value)
    })
  }
}

function filterQuestions(searchTerm, difficulty) {
  filteredQuestions = allQuestions.filter((question) => {
    const matchesSearch =
      question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDifficulty = !difficulty || question.difficulty === difficulty
    return matchesSearch && matchesDifficulty
  })

  renderQuestionsList(filteredQuestions)
}

// Update deleteQuestion function with better error handling
async function deleteQuestion(questionId) {
  if (!confirm("Are you sure you want to delete this question? This action cannot be undone.")) {
    return
  }

  try {
    showLoading(true)
    const response = await fetch(`${API_BASE_URL}/admin/questions/${questionId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      showNotification("Question deleted successfully!", "success")
      loadAdminQuestions()
    } else {
      const errorText = await response.text()
      console.error("Delete error:", errorText)
      showNotification("Error deleting question: " + errorText, "error")
    }
  } catch (error) {
    console.error("Delete error:", error)
    showNotification("Error deleting question: " + error.message, "error")
  } finally {
    showLoading(false)
  }
}

// Participant Functions
async function loadParticipantQuestions() {
  console.log("[v0] Loading participant questions")
  showLoading(true)

  try {
    const response = await fetch(`${API_BASE_URL}/participant/questions`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })

    console.log("[v0] Questions response status:", response.status)

    if (!response.ok) {
      if (response.status === 401) {
        showNotification("Session expired. Please login again.", "error")
        setTimeout(() => handleLogout(), 1500)
        return
      }
      throw new Error(`Failed to load questions: ${response.status}`)
    }

    const questions = await response.json()
    console.log("[v0] Loaded questions:", questions.length)

    if (questions.length === 0) {
      showNotification("No questions available yet. Please contact admin.", "info")
    }

    displayParticipantQuestions(questions)
  } catch (error) {
    console.error("[v0] Error loading questions:", error)
    showNotification("Error loading questions: " + error.message, "error")
  } finally {
    showLoading(false)
  }
}

function displayParticipantQuestions(questions) {
  allQuestions = questions
  filteredQuestions = questions
  const container = document.getElementById("participantQuestionsList")
  container.innerHTML = ""

  if (questions.length === 0) {
    container.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <i class="fas fa-search text-4xl mb-4"></i>
                <p class="text-lg">No questions found</p>
                <p class="text-sm">Try adjusting your search or filter criteria</p>
            </div>
        `
    return
  }

  questions.forEach((question, index) => {
    const questionDiv = document.createElement("div")
    questionDiv.className = "bg-white border border-gray-200 rounded-xl p-6 card-hover animate-fade-in"
    questionDiv.style.animationDelay = `${index * 0.1}s`

    const difficultyClass =
      question.difficulty === "EASY"
        ? "difficulty-easy"
        : question.difficulty === "MEDIUM"
          ? "difficulty-medium"
          : "difficulty-hard"

    questionDiv.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center space-x-3 mb-3">
                        <h4 class="font-bold text-lg text-gray-800">${question.title}</h4>
                        <span class="px-3 py-1 text-xs rounded-full font-medium ${difficultyClass}">
                            ${question.difficulty}
                        </span>
                    </div>
                    <p class="text-gray-600 text-sm mb-4 leading-relaxed">${question.description.substring(0, 150)}...</p>
                    <div class="flex flex-wrap gap-2 mb-3">
                        <span class="inline-flex items-center px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            <i class="fas fa-keyboard mr-1"></i>
                            Input: ${question.inputFormatType.replace(/_/g, " ")}
                        </span>
                        <span class="inline-flex items-center px-3 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            <i class="fas fa-check-circle mr-1"></i>
                            Test Cases: ${question.testCases ? question.testCases.length : 0}
                        </span>
                    </div>
                    <div class="text-xs text-gray-500">
                        <i class="fas fa-info-circle mr-1"></i>
                        Complete solution required - write full program with input/output handling
                    </div>
                </div>
                <div class="flex space-x-2 ml-4">
                    <button onclick="openCodingInterface(${question.id})" class="btn-icon btn-edit" title="Start Coding">
                        <i class="fas fa-code"></i>
                    </button>
                </div>
            </div>
        `
    container.appendChild(questionDiv)
  })
}

// Function to handle loading and displaying of the coding interface
function openCodingInterface(questionId) {
  currentQuestion = allQuestions.find((q) => q.id === questionId)

  if (!currentQuestion) {
    showNotification("Question not found", "error")
    return
  }

  document.getElementById("participantDashboard").classList.add("hidden")
  document.getElementById("codingInterface").classList.remove("hidden")

  // Display question details
  const difficultyClass =
    currentQuestion.difficulty === "EASY"
      ? "difficulty-easy"
      : currentQuestion.difficulty === "MEDIUM"
        ? "difficulty-medium"
        : "difficulty-hard"

  document.getElementById("currentQuestionTitle").textContent = currentQuestion.title
  document.getElementById("currentQuestionDifficulty").innerHTML =
    `<span class="px-4 py-2 rounded-full text-sm font-medium ${difficultyClass}">${currentQuestion.difficulty}</span>`
  document.getElementById("currentQuestionInputFormat").textContent =
    `Input: ${currentQuestion.inputFormatType.replace(/_/g, " ")}`

  document.getElementById("currentQuestionDescription").textContent = currentQuestion.description

  // Initialize code editor - destroy old instance if exists
  const editorTextarea = document.getElementById("codeEditor")
  if (codeEditor) {
    codeEditor.toTextArea()
  }

  const languageSelect = document.getElementById("languageSelect")
  const selectedLanguage = languageSelect.value
  const boilerplate = languageBoilerplates[selectedLanguage]

  // Create new editor instance
  codeEditor = CodeMirror.fromTextArea(editorTextarea, {
    lineNumbers: true,
    mode:
      selectedLanguage === "71"
        ? "python"
        : selectedLanguage === "62"
          ? "text/x-java"
          : selectedLanguage === "54"
            ? "text/x-c++src"
            : selectedLanguage === "50"
              ? "text/x-csrc"
              : "text/javascript",
    theme: "default",
    indentUnit: 4,
    indentWithTabs: false,
    matchBrackets: true,
    autoCloseBrackets: true,
    styleActiveLine: true,
  })

  loadCodeDraft(boilerplate)
}

// Function to handle back to questions button
function backToParticipantDashboard() {
  // Save current code draft before going back
  if (currentQuestion && codeEditor) {
    saveCodeDraft()
  }

  document.getElementById("codingInterface").classList.add("hidden")
  document.getElementById("participantDashboard").classList.remove("hidden")
}

// Function to handle code running
async function runCode(action) {
  console.log("[v0] runCode called with action:", action, "currentQuestion:", currentQuestion?.id)

  if (!currentQuestion || !currentQuestion.id) {
    showNotification("No question selected", "error")
    return
  }

  const code = codeEditor.getValue()
  if (!code.trim()) {
    showNotification("Please write some code first", "error")
    return
  }

  const languageSelect = document.getElementById("languageSelect")
  const languageId = Number.parseInt(languageSelect.value)

  showLoading(true)
  const testResultsDiv = document.getElementById("resultsContainer")
  testResultsDiv.innerHTML = `<div class="text-gray-600 italic">Executing code...</div>`

  try {
    const endpoint =
      action === "compile"
        ? `${API_BASE_URL}/participant/compile`
        : action === "run"
          ? `${API_BASE_URL}/participant/run`
          : action === "submit"
            ? `${API_BASE_URL}/participant/submit`
            : `${API_BASE_URL}/participant/run`

    const payload = {
      questionId: currentQuestion.id,
      code: code,
      languageId: languageId,
    }

    console.log("[v0] Payload:", payload, "Endpoint:", endpoint)

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Error response:", errorText)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log("[v0] Code execution result:", result)

    displayCodeResults(result, action)
  } catch (error) {
    console.error("[v0] Error executing code:", error)
    showNotification("Error executing code: " + error.message, "error")
    testResultsDiv.innerHTML = `<div class="text-red-600">Error: ${error.message}</div>`
  } finally {
    showLoading(false)
  }
}

// Function to display results differently for compile vs run
function displayCodeResults(result, action) {
  const testResultsDiv = document.getElementById("resultsContainer")

  if (!testResultsDiv) {
    console.error("[v0] Results container not found")
    showNotification("Error: Results panel not found", "error")
    return
  }

  testResultsDiv.innerHTML = ""

  if (result.status === "COMPILATION_ERROR") {
    testResultsDiv.innerHTML = `
      <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <h3 class="text-red-700 font-bold mb-2">Compilation Error</h3>
        <pre class="text-red-600 text-sm bg-white p-3 rounded border border-red-200 overflow-auto">${escapeHtml(result.error)}</pre>
      </div>
    `
    return
  }

  const showDetailed = action === "compile" || action === "submit" || result.showDetailedResults === true

  if (action === "run" && !showDetailed) {
    // For RUN: Show summary with checkmarks
    const passedCount = result.passedTestCases || 0
    const totalCount = result.totalTestCases || 0
    const percentage = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0

    testResultsDiv.innerHTML = `
      <div class="space-y-4">
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-lg">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-blue-900">Test Results Summary</h3>
            <span class="text-3xl font-bold text-blue-600">${passedCount}/${totalCount}</span>
          </div>
          <div class="bg-white rounded-full h-3 overflow-hidden border border-blue-200">
            <div class="bg-gradient-to-r from-green-400 to-blue-600 h-full" style="width: ${percentage}%"></div>
          </div>
          <p class="text-sm text-blue-700 mt-3 font-medium">${percentage}% tests passed</p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="bg-green-50 border border-green-200 p-4 rounded text-center">
            <div class="text-2xl font-bold text-green-600">${passedCount}</div>
            <div class="text-sm text-green-700">Passed</div>
          </div>
          <div class="bg-red-50 border border-red-200 p-4 rounded text-center">
            <div class="text-2xl font-bold text-red-600">${totalCount - passedCount}</div>
            <div class="text-sm text-red-700">Failed</div>
          </div>
        </div>
      </div>
    `
  } else if (action === "compile" || action === "submit" || showDetailed) {
    // For COMPILE/SUBMIT: Show detailed test case results
    testResultsDiv.innerHTML = `<div class="space-y-3">`

    if (result.status === "ACCEPTED") {
      testResultsDiv.innerHTML += `
        <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <h3 class="text-green-700 font-bold">All Tests Passed!</h3>
        </div>
      `
    } else {
      testResultsDiv.innerHTML += `
        <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <h3 class="text-red-700 font-bold">Some test cases failed</h3>
        </div>
      `
    }

    // Display each test case
    if (result.testCaseResults && result.testCaseResults.length > 0) {
      result.testCaseResults.forEach((testResult, index) => {
        const statusClass = testResult.passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
        const statusIcon = testResult.passed ? "✓" : "✗"
        const statusColor = testResult.passed ? "text-green-600" : "text-red-600"

        testResultsDiv.innerHTML += `
          <div class="border ${statusClass} rounded-lg p-4 space-y-2">
            <div class="flex items-center gap-2 font-bold ${statusColor}">
              <span class="text-lg">${statusIcon}</span>
              <span>Test Case ${index + 1}</span>
              <span class="ml-auto text-sm font-normal">${testResult.message}</span>
            </div>

            ${
              testResult.input !== "Hidden"
                ? `
              <div class="bg-white border border-gray-200 rounded p-2 text-xs">
                <div class="text-gray-700 font-semibold mb-1">Input:</div>
                <pre class="overflow-auto bg-gray-50 p-2 rounded text-gray-800">${escapeHtml(testResult.input)}</pre>
              </div>
            `
                : ""
            }

            ${
              testResult.expectedOutput !== "Hidden"
                ? `
              <div class="bg-white border border-gray-200 rounded p-2 text-xs">
                <div class="text-gray-700 font-semibold mb-1">Expected Output:</div>
                <pre class="overflow-auto bg-gray-50 p-2 rounded text-gray-800">${escapeHtml(testResult.expectedOutput)}</pre>
              </div>
            `
                : ""
            }

            ${
              testResult.actualOutput !== "Hidden" && testResult.actualOutput
                ? `
              <div class="bg-white border border-gray-200 rounded p-2 text-xs">
                <div class="text-gray-700 font-semibold mb-1">Your Output:</div>
                <pre class="overflow-auto bg-gray-50 p-2 rounded text-gray-800">${escapeHtml(testResult.actualOutput)}</pre>
              </div>
            `
                : ""
            }
          </div>
        `
      })
    }

    testResultsDiv.innerHTML += `</div>`
  }
}

// Helper function to escape HTML to prevent XSS
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

function updateEditorMode() {
  const languageSelect = document.getElementById("languageSelect")
  const selectedLanguage = languageSelect.value

  // Map language ID to CodeMirror mode
  const modeMap = {
    71: "python",
    62: "text/x-java",
    54: "text/x-c++src",
    50: "text/x-csrc",
    63: "text/javascript",
  }

  const editorMode = modeMap[selectedLanguage] || "text/x-c++src"

  // Save current code if it's not the default boilerplate
  const currentCode = codeEditor.getValue()

  // Set the new mode
  codeEditor.setOption("mode", editorMode)

  // Update boilerplate if current code is empty or is the old boilerplate
  const boilerplate = languageBoilerplates[selectedLanguage]

  let shouldUpdateBoilerplate = currentCode.trim() === ""

  // Check if current code matches any existing boilerplate (user just switched without coding)
  for (const key of Object.keys(languageBoilerplates)) {
    if (currentCode.trim() === languageBoilerplates[key].trim()) {
      shouldUpdateBoilerplate = true
      break
    }
  }

  if (shouldUpdateBoilerplate && boilerplate) {
    codeEditor.setValue(boilerplate)
  }
}

// Function to handle submit all button
async function submitAllQuestions() {
  if (!currentUser || currentUser.role !== "PARTICIPANT") {
    showNotification("Only participants can submit", "error")
    return
  }

  const confirmSubmit = confirm(
    "Are you sure you want to submit all questions? This action cannot be undone and will end your test.",
  )
  if (!confirmSubmit) return

  // Show enhanced loading screen
  const loadingSpinner = document.getElementById("loadingSpinner")
  const loadingMessage = document.getElementById("loadingMessage")
  loadingSpinner.classList.remove("hidden")
  loadingSpinner.classList.add("flex")
  loadingMessage.textContent = "Compiling and running all questions..."

  try {
    // Get all code drafts
    const response = await fetch(`${API_BASE_URL}/participant/questions`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch questions")
    }

    const questions = await response.json()
    let completedCount = 0
    const totalQuestions = questions.length

    for (const question of questions) {
      loadingMessage.textContent = `Processing: ${question.title} (${completedCount + 1}/${totalQuestions})`

      try {
        // Get the code draft for this question
        const draftResponse = await fetch(`${API_BASE_URL}/participant/get-draft?questionId=${question.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })

        if (draftResponse.ok) {
          const draft = await draftResponse.json()

          // Run code for final submission
          await fetch(`${API_BASE_URL}/participant/submit`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              questionId: question.id,
              code: draft.code || "",
              languageId: draft.languageId || 71,
            }),
          })
        }
      } catch (err) {
        console.error(`[v0] Error processing question ${question.id}:`, err)
      }

      completedCount++
    }

    // After all submissions, call submit-all endpoint
    loadingMessage.textContent = "Finalizing submission and calculating scores..."

    const submitAllResponse = await fetch(`${API_BASE_URL}/participant/submit-all`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    if (!submitAllResponse.ok) {
      throw new Error(`HTTP error! status: ${submitAllResponse.status}`)
    }

    const result = await submitAllResponse.json()
    console.log("[v0] Submit all result:", result)

    // Hide loading screen
    loadingSpinner.classList.add("hidden")
    loadingSpinner.classList.remove("flex")

    document.getElementById("codingInterface").classList.add("hidden")
    document.getElementById("participantDashboard").classList.add("hidden")
    document.getElementById("submissionSuccessScreen").classList.remove("hidden")

    // Countdown and logout
    let countdownTime = 5
    const countdownEl = document.getElementById("logoutCountdown")

    const countdownInterval = setInterval(() => {
      countdownTime--
      if (countdownEl) {
        countdownEl.textContent = countdownTime
      }

      if (countdownTime <= 0) {
        clearInterval(countdownInterval)
        handleLogout()
      }
    }, 1000)

    showNotification("All questions compiled, run, and submitted successfully!", "success")
    autoSubmitted = true // Mark as auto-submitted to prevent duplicate submission
  } catch (error) {
    console.error("[v0] Error submitting all questions:", error)
    showNotification("Error submitting all questions: " + error.message, "error")
    loadingSpinner.classList.add("hidden")
    loadingSpinner.classList.remove("flex")
  }
}

// Function to load leaderboard
function loadLeaderboard() {
  console.log("[v0] Loading leaderboard")
  showLoading(true)

  fetch(`${API_BASE_URL}/admin/leaderboard`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    })
    .then((leaderboardData) => {
      console.log("[v0] Leaderboard data:", leaderboardData)

      const leaderboardTable = document.getElementById("leaderboardTable")
      if (!leaderboardTable) {
        console.error("[v0] Leaderboard table not found")
        return
      }

      leaderboardTable.innerHTML = ""

      if (!leaderboardData || leaderboardData.length === 0) {
        leaderboardTable.innerHTML = `
          <tr>
            <td colspan="4" class="px-6 py-4 text-center text-gray-500">
              No submissions yet
            </td>
          </tr>
        `
        return
      }

      leaderboardData.forEach((entry, index) => {
        const rank = entry.rank || index + 1
        const submissionTime = entry.submissionTime ? new Date(entry.submissionTime).toLocaleString() : "Not submitted"

        const row = document.createElement("tr")
        row.className = "hover:bg-gray-50 transition-colors duration-200"
        row.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              ${
                rank === 1
                  ? '<i class="fas fa-crown text-yellow-500 text-xl mr-2"></i>'
                  : rank === 2
                    ? '<i class="fas fa-medal text-gray-400 text-xl mr-2"></i>'
                    : rank === 3
                      ? '<i class="fas fa-medal text-orange-600 text-xl mr-2"></i>'
                      : ""
              }
              <span class="text-lg font-bold text-gray-800">#${rank}</span>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div>
              <p class="text-sm font-semibold text-gray-800">${entry.username}</p>
              <p class="text-sm text-gray-500">${entry.email}</p>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800">
              <i class="fas fa-star mr-1"></i>${entry.grandTotalScore} points
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
            ${submissionTime}
          </td>
        `
        leaderboardTable.appendChild(row)
      })

      showNotification("Leaderboard updated successfully", "success")
    })
    .catch((error) => {
      console.error("[v0] Error loading leaderboard:", error)
      showNotification("Error loading leaderboard: " + error.message, "error")

      const leaderboardTable = document.getElementById("leaderboardTable")
      if (leaderboardTable) {
        leaderboardTable.innerHTML = `
          <tr>
            <td colspan="4" class="px-6 py-4 text-center text-red-500">
              Error loading leaderboard
            </td>
          </tr>
        `
      }
    })
    .finally(() => {
      showLoading(false)
    })
}

// Dummy functions for undeclared variables
function showLoading(isLoading) {
  const spinner = document.getElementById("loadingSpinner")
  const message = document.getElementById("loadingMessage")

  if (isLoading) {
    spinner.classList.remove("hidden")
    spinner.classList.add("flex")
    message.textContent = "Processing your request..."
  } else {
    spinner.classList.add("hidden")
    spinner.classList.remove("flex")
  }
}

function loadQuestionForEdit(questionId) {
  // Placeholder for loadQuestionForEdit function
  console.log(`loadQuestionForEdit called with: ${questionId}`)
}

function loadCodeDraft(boilerplate) {
  const languageSelect = document.getElementById("languageSelect")
  const selectedLanguage = languageSelect.value

  showLoading(true)

  fetch(`${API_BASE_URL}/participant/get-draft/${currentQuestion.id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  })
    .then((response) => {
      if (response.ok) {
        return response.json()
      }
      // If no draft exists, return null to use boilerplate
      return null
    })
    .then((draft) => {
      if (draft && draft.code) {
        // Load the saved draft code
        console.log("[v0] Loading saved draft for question", currentQuestion.id)
        codeEditor.setValue(draft.code)

        // Update language select if different
        if (draft.languageId && draft.languageId.toString() !== selectedLanguage) {
          languageSelect.value = draft.languageId
          updateEditorMode()
        }
      } else {
        // No draft found, use boilerplate
        console.log("[v0] No draft found, using boilerplate for question", currentQuestion.id)
        codeEditor.setValue(boilerplate)
      }
      showLoading(false)
    })
    .catch((error) => {
      console.error("[v0] Error loading code draft:", error)
      // Fall back to boilerplate on error
      codeEditor.setValue(boilerplate)
      showLoading(false)
    })
}

function saveCodeDraft() {
  if (!currentQuestion || !codeEditor) {
    console.warn("[v0] Cannot save draft: no question or editor")
    return
  }

  const code = codeEditor.getValue()
  const languageSelect = document.getElementById("languageSelect")
  const languageId = Number.parseInt(languageSelect.value)

  console.log("[v0] Saving draft for question", currentQuestion.id, "with language", languageId)

  fetch(`${API_BASE_URL}/participant/save-draft`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({
      questionId: currentQuestion.id,
      code: code,
      languageId: languageId,
    }),
  })
    .then((response) => {
      if (response.ok) {
        console.log("[v0] Draft saved successfully for question", currentQuestion.id)
        showNotification("Draft saved", "success")
        return response.json()
      } else {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    })
    .catch((error) => {
      console.error("[v0] Error saving code draft:", error)
      showNotification("Error saving draft: " + error.message, "error")
    })
}
