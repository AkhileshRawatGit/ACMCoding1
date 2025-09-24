const API_BASE_URL = "http://localhost:8080/api"
let currentUser = null
let currentQuestion = null
let codeEditor = null
const CodeMirror = window.CodeMirror // Declare CodeMirror variable
let filteredQuestions = []
let allQuestions = []

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
  //  const token = localStorage.getItem("token");

  fetch("http://localhost:8080/api/admin/questions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtToken}`, // attach JWT token
    },
    body: JSON.stringify({
      // your payload here
      title: "Sample Question",
      description: "This is a test",
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed: " + response.status)
      }
      return response.json()
    })
    .then((data) => {
      console.log("Success:", data)
    })
    .catch((err) => {
      console.error("Error:", err)
    })
}

// The 'user' variable was undeclared. Assuming it should be fetched from localStorage or passed in.
// For now, we'll check if currentUser is already set or try to load it.
const storedUser = localStorage.getItem("user")
if (jwtToken() && storedUser) {
  currentUser = JSON.parse(storedUser)
  showDashboard()
} else {
  showAuthScreen()
}

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
  document.getElementById("backToQuestions")?.addEventListener("click", showDashboard)
  document.getElementById("compileBtn")?.addEventListener("click", () => runCode("compile"))
  document.getElementById("runBtn")?.addEventListener("click", () => runCode("run"))
  document.getElementById("submitBtn")?.addEventListener("click", () => runCode("submit"))
  document.getElementById("languageSelect")?.addEventListener("change", updateEditorMode)

  // Setup search and filter
  setupSearchAndFilter()
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

  console.log("Attempting login with:", username) // Debug line

  try {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })

    console.log("Response status:", response.status) // Debug line
    console.log("Response headers:", response.headers) // Debug line

    if (!response.ok) {
      console.log("Response not OK, status:", response.status)
      alert("Server error: " + response.status)
      return
    }

    const data = await response.json()

    if (!data.accessToken) {
      alert("Login failed: Access token missing from response.")
      return
    }
    if (!data.user) {
      alert("Login failed: User data missing from response. Please check backend configuration.")
      console.error("Login response missing user data:", data)
      return
    }

    if (response.ok) {
      localStorage.setItem("token", data.accessToken)
      localStorage.setItem("user", JSON.stringify(data.user))
      currentUser = data.user
      showDashboard()
    } else {
      alert(data.message || "Login failed")
    }
  } catch (error) {
    console.error("Full error:", error) // Debug line
    alert("Login failed: " + error.message)
  }
}

async function handleRegister(e) {
  e.preventDefault();

  const username = document.getElementById("registerUsername").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  const role = document.getElementById("registerRole").value;

  try {
    // Relative path ensures it works both locally and on Railway
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, role }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("Registration successful! Please login.");
      switchTab("login"); // If you have tab switching logic
    } else {
      alert(data.message || "Registration failed");
    }
  } catch (error) {
    alert("Registration failed: " + error.message);
  }
}

function handleLogout() {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  currentUser = null
  showAuthScreen()
}

// Screen Management
function showAuthScreen() {
  document.getElementById("authScreen").classList.remove("hidden")
  document.getElementById("navbar").classList.add("hidden")
  document.getElementById("adminDashboard").classList.add("hidden")
  document.getElementById("participantDashboard").classList.add("hidden")
  document.getElementById("codingInterface").classList.add("hidden")
}

function showDashboard() {
  document.getElementById("authScreen").classList.add("hidden")
  document.getElementById("navbar").classList.remove("hidden")
  document.getElementById("userInfo").textContent = `${currentUser.username} (${currentUser.role})`

  if (currentUser.role === "ADMIN") {
    document.getElementById("adminDashboard").classList.remove("hidden")
    document.getElementById("participantDashboard").classList.add("hidden")
    document.getElementById("codingInterface").classList.add("hidden")
    loadAdminQuestions().then(() => {
      setupSearchAndFilter()
    })
  } else {
    document.getElementById("participantDashboard").classList.remove("hidden")
    document.getElementById("adminDashboard").classList.add("hidden")
    document.getElementById("codingInterface").classList.add("hidden")
    loadParticipantQuestions()
  }
}

// Admin Functions
async function loadAdminQuestions() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/questions`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })

    const questions = await response.json()
    displayAdminQuestions(questions)
  } catch (error) {
    console.error("Error loading questions:", error)
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
  try {
    const response = await fetch(`${API_BASE_URL}/participant/questions`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })

    const questions = await response.json()
    displayParticipantQuestions(questions)
  } catch (error) {
    console.error("Error loading questions:", error)
  }
}

// Update displayParticipantQuestions function with enhanced UI
function displayParticipantQuestions(questions) {
  const container = document.getElementById("participantQuestionsList")
  container.innerHTML = ""

  if (questions.length === 0) {
    container.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-500">
                <i class="fas fa-code text-6xl mb-4"></i>
                <h3 class="text-xl font-semibold mb-2">No Questions Available</h3>
                <p>Check back later for new coding challenges!</p>
            </div>
        `
    return
  }

  questions.forEach((question, index) => {
    const questionCard = document.createElement("div")
    questionCard.className = "bg-white rounded-xl shadow-lg p-6 cursor-pointer card-hover animate-fade-in"
    questionCard.style.animationDelay = `${index * 0.1}s`
    questionCard.onclick = () => openCodingInterface(question)

    const difficultyClass =
      question.difficulty === "EASY"
        ? "difficulty-easy"
        : question.difficulty === "MEDIUM"
          ? "difficulty-medium"
          : "difficulty-hard"
    const difficultyIcon = question.difficulty === "EASY" ? "🟢" : question.difficulty === "MEDIUM" ? "🟡" : "🔴"

    questionCard.innerHTML = `
            <div class="flex items-start justify-between mb-4">
                <h3 class="font-bold text-xl text-gray-800 flex-1 pr-4">${question.title}</h3>
                <span class="px-3 py-1 text-xs rounded-full font-medium ${difficultyClass}">
                    ${difficultyIcon} ${question.difficulty}
                </span>
            </div>
            <p class="text-gray-600 text-sm mb-6 leading-relaxed">${question.description.substring(0, 120)}...</p>
            <div class="space-y-3">
                <div class="flex items-center justify-between text-sm">
                    <span class="flex items-center text-gray-600">
                        <i class="fas fa-keyboard mr-2"></i>
                        Input: ${question.inputFormatType.replace(/_/g, " ")}
                    </span>
                    <span class="flex items-center text-indigo-600 font-medium">
                        <i class="fas fa-check-circle mr-1"></i>
                        ${question.testCases ? question.testCases.length : 0} test cases
                    </span>
                </div>
                <div class="text-xs text-gray-500 border-t pt-3">
                    <i class="fas fa-code mr-1"></i>
                    Write complete solution with input/output handling
                </div>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-100">
                <div class="flex items-center justify-center text-indigo-600 font-medium">
                    <i class="fas fa-play mr-2"></i>
                    Start Coding
                </div>
            </div>
        `
    container.appendChild(questionCard)
  })
}

function openCodingInterface(question) {
  currentQuestion = question

  // Hide dashboard, show coding interface
  document.getElementById("participantDashboard").classList.add("hidden")
  document.getElementById("codingInterface").classList.remove("hidden")

  // Populate question details
  document.getElementById("currentQuestionTitle").textContent = question.title
  document.getElementById("currentQuestionDescription").textContent = question.description

  const difficultySpan = document.getElementById("currentQuestionDifficulty")
  difficultySpan.textContent = question.difficulty
  difficultySpan.className = `px-3 py-1 rounded-full text-sm ${getDifficultyClass(question.difficulty)}`

  const inputFormatSpan = document.getElementById("currentQuestionInputFormat")
  inputFormatSpan.textContent = `Input: ${question.inputFormatType.replace(/_/g, " ")}`
  inputFormatSpan.className = `px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-800`

  // Initialize code editor
  initializeCodeEditor()

  // Clear previous results
  document.getElementById("resultsContainer").innerHTML = '<p class="text-gray-500">Run your code to see results...</p>'
}

function initializeCodeEditor() {
  const textarea = document.getElementById("codeEditor")
  if (textarea && typeof CodeMirror !== "undefined") {
    codeEditor = CodeMirror.fromTextArea(textarea, {
      lineNumbers: true,
      mode: "text/x-java",
      theme: "monokai",
      indentUnit: 4,
      lineWrapping: true,
      autoCloseBrackets: true,
      matchBrackets: true,
      styleActiveLine: true,
      extraKeys: {
        "Ctrl-Space": "autocomplete",
        Tab: (cm) => {
          if (cm.somethingSelected()) {
            cm.indentSelection("add")
          } else {
            cm.replaceSelection("    ")
          }
        },
      },
    })

    const defaultLanguage = document.getElementById("languageSelect").value
    codeEditor.setValue(languageBoilerplates[defaultLanguage] || "")

    document.getElementById("languageSelect").addEventListener("change", function () {
      const languageId = this.value
      const modes = {
        71: "python",
        62: "text/x-java",
        54: "text/x-c++src",
        50: "text/x-csrc",
        63: "javascript",
      }

      codeEditor.setOption("mode", modes[languageId] || "text/plain")

      if (codeEditor.getValue().trim() === "" || confirm("Switch language and load boilerplate code?")) {
        codeEditor.setValue(languageBoilerplates[languageId] || "")
      }
    })
  }
}

function updateEditorMode() {
  const languageSelect = document.getElementById("languageSelect")
  const selectedLanguage = languageSelect.value

  if (!currentQuestion) {
    // Fallback if no question is selected (e.g., on initial load)
    codeEditor.setOption("mode", "python")
    codeEditor.setValue(`def solution(a, b):\n  # Write your Python code here\n  return a + b`)
    return
  }

  const returnType = currentQuestion.returnType
  const parameters = currentQuestion.parameters

  let mode = "python"
  let defaultCode = ""
  const functionParamsSignature = parameters.map((p) => p.name).join(", ")

  switch (selectedLanguage) {
    case "71": // Python
      mode = "python"
      defaultCode = `def solution(${functionParamsSignature}):
    # Write your Python code here
    pass`
      break
    case "62": // Java
      mode = "text/x-java"
      const javaReturnType = getJavaType(returnType)
      const javaFunctionParams = parameters.map((p) => `${getJavaType(p.type)} ${p.name}`).join(", ")
      defaultCode = `class Solution {
    public ${javaReturnType} solution(${javaFunctionParams}) {
        // Write your Java code here
        ${javaReturnType === "void" ? "" : "return null;"} // Placeholder return
    }
}`
      break
    case "54": // C++
      mode = "text/x-c++src"
      const cppReturnType = getCppType(returnType)
      const cppFunctionParams = parameters.map((p) => `${getCppType(p.type)} ${p.name}`).join(", ")
      defaultCode = `${cppReturnType} solution(${cppFunctionParams}) {
    // Write your C++ code here
    ${cppReturnType === "void" ? "" : "return {};"} // Placeholder return
}`
      break
    case "50": // C
      mode = "text/x-csrc"
      const cReturnType = getCType(returnType)
      const cFunctionParams = parameters.map((p) => `${getCType(p.type)} ${p.name}`).join(", ")
      defaultCode = `${cReturnType} solution(${cFunctionParams}) {
    // Write your C code here
    ${cReturnType === "void" ? "" : "return 0;"} // Placeholder return
}`
      break
    case "63": // JavaScript
      mode = "javascript"
      defaultCode = `function solution(${functionParamsSignature}) {
    // Write your JavaScript code here
    return null;
}`
      break
  }

  if (codeEditor) {
    codeEditor.setOption("mode", mode)
    codeEditor.setValue(defaultCode)
  }
}

// Enhanced helper functions to get language-specific types
function getJavaType(type) {
  switch (type) {
    case "INTEGER":
      return "int"
    case "FLOAT":
      return "float"
    case "DOUBLE":
      return "double"
    case "CHAR":
      return "char"
    case "BOOLEAN":
      return "boolean"
    case "STRING":
      return "String"
    case "INTEGER_ARRAY":
      return "int[]"
    case "FLOAT_ARRAY":
      return "Float[]"
    case "DOUBLE_ARRAY":
      return "double[]"
    case "CHAR_ARRAY":
      return "char[]"
    case "STRING_ARRAY":
      return "String[]"
    case "BOOLEAN_ARRAY":
      return "Boolean[]"
    case "LIST_INTEGER":
      return "List<Integer>"
    case "LIST_STRING":
      return "List<String>"
    case "LIST_DOUBLE":
      return "List<Double>"
    case "LIST_FLOAT":
      return "List<Float>"
    case "LIST_BOOLEAN":
      return "List<Boolean>"
    case "LISTNODE_PTR":
      return "ListNode"
    case "TREENODE_PTR":
      return "TreeNode"
    case "VOID":
      return "void"
    default:
      return "Object"
  }
}

function getCppType(type) {
  switch (type) {
    case "INTEGER":
      return "int"
    case "FLOAT":
      return "float"
    case "DOUBLE":
      return "double"
    case "CHAR":
      return "char"
    case "BOOLEAN":
      return "bool"
    case "STRING":
      return "std::string"
    case "INTEGER_ARRAY":
    case "VECTOR_INT":
      return "std::vector<int>"
    case "FLOAT_ARRAY":
    case "VECTOR_FLOAT":
      return "std::vector<float>"
    case "DOUBLE_ARRAY":
    case "VECTOR_DOUBLE":
      return "std::vector<double>"
    case "CHAR_ARRAY":
    case "VECTOR_CHAR":
      return "std::vector<char>"
    case "STRING_ARRAY":
    case "VECTOR_STRING":
      return "std::vector<std::string>"
    case "BOOLEAN_ARRAY":
    case "VECTOR_BOOL":
      return "std::vector<bool>"
    case "MAP_INT_INT":
      return "std::map<int, int>"
    case "MAP_STRING_INT":
      return "std::map<std::string, int>"
    case "MAP_INT_STRING":
      return "std::map<int, std::string>"
    case "MAP_STRING_STRING":
      return "std::map<std::string, std::string>"
    case "UNORDERED_MAP_INT_INT":
      return "std::unordered_map<int, int>"
    case "UNORDERED_MAP_STRING_INT":
      return "std::unordered_map<std::string, int>"
    case "UNORDERED_MAP_INT_STRING":
      return "std::unordered_map<int, std::string>"
    case "UNORDERED_MAP_STRING_STRING":
      return "std::unordered_map<std::string, std::string>"
    case "SET_INT":
      return "std::set<int>"
    case "SET_STRING":
      return "std::set<std::string>"
    case "UNORDERED_SET_INT":
      return "std::unordered_set<int>"
    case "UNORDERED_SET_STRING":
      return "std::unordered_set<std::string>"
    case "QUEUE_INT":
      return "std::queue<int>"
    case "STACK_INT":
      return "std::stack<int>"
    case "DEQUE_INT":
      return "std::deque<int>"
    case "PRIORITY_QUEUE_INT":
      return "std::priority_queue<int>"
    case "PAIR_INT_INT":
      return "std::pair<int, int>"
    case "PAIR_STRING_INT":
      return "std::pair<std::string, int>"
    case "PAIR_INT_STRING":
      return "std::pair<int, std::string>"
    case "PAIR_STRING_STRING":
      return "std::pair<std::string, std::string>"
    case "LISTNODE_PTR":
      return "ListNode*"
    case "TREENODE_PTR":
      return "TreeNode*"
    case "VOID":
      return "void"
    default:
      return "void*"
  }
}

function getCType(type) {
  switch (type) {
    case "INTEGER":
      return "int"
    case "FLOAT":
      return "float"
    case "DOUBLE":
      return "double"
    case "CHAR":
      return "char"
    case "BOOLEAN":
      return "bool" // C uses bool with stdbool.h
    case "STRING":
      return "char*"
    case "INTEGER_ARRAY":
      return "int*" // C arrays need size parameter too
    case "FLOAT_ARRAY":
      return "float*"
    case "DOUBLE_ARRAY":
      return "double*"
    case "STRING_ARRAY":
      return "char**" // C string arrays need size
    case "LISTNODE_PTR":
      return "struct ListNode*"
    case "TREENODE_PTR":
      return "struct TreeNode*"
    case "VOID":
      return "void"
    default:
      return "void*"
  }
}

async function runCode(action) {
  const code = codeEditor.getValue()
  const languageId = document.getElementById("languageSelect").value

  if (!code.trim()) {
    showNotification("Please write some code first!", "error")
    return
  }

  showLoading(true)

  try {
    let endpoint = ""
    switch (action) {
      case "compile":
        endpoint = "/participant/compile"
        break
      case "run":
        endpoint = "/participant/run"
        break
      case "submit":
        endpoint = "/participant/submit"
        break
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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

    const result = await response.json()
    displayResults(result, action)

    if (action === "submit" && response.ok) {
      showSubmitSuccess(result.obtainedMarks, result.totalMarks)
    }
  } catch (error) {
    showNotification("Error running code: " + error.message, "error")
  } finally {
    showLoading(false)
  }
}

function showSubmitSuccess(obtainedMarks, totalMarks) {
  const indicator = document.getElementById("submitIndicator")
  const scoreElement = document.getElementById("submitScore")

  scoreElement.textContent = `Score: ${obtainedMarks}/${totalMarks} marks`
  indicator.classList.remove("hidden")

  setTimeout(() => {
    indicator.classList.add("hidden")
  }, 2000)
}

function displayResults(result, action) {
  const container = document.getElementById("resultsContainer")
  container.innerHTML = ""

  if (result.error) {
    container.innerHTML = `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">${result.error}</div>`
    return
  }

  // Summary
  const summary = document.createElement("div")
  summary.className = "bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4"
  summary.innerHTML = `
        <strong>Results Summary:</strong><br>
        Passed: ${result.passedTestCases}/${result.totalTestCases} test cases<br>
        ${action === "submit" ? `Score: ${result.obtainedMarks}/${result.totalMarks} marks` : ""}
    `
  container.appendChild(summary)

  // Test case results
  result.testCaseResults.forEach((testResult, index) => {
    const testDiv = document.createElement("div")
    testDiv.className = `border rounded p-4 mb-4 ${testResult.passed ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50"}`

    let content = `
            <div class="flex justify-between items-center mb-2">
                <strong>Test Case ${index + 1}</strong>
                <span class="px-2 py-1 rounded text-sm ${testResult.passed ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}">
                    ${testResult.passed ? "PASSED" : "FAILED"}
                </span>
            </div>
        `

    if (action === "run" || action === "submit" || (action === "compile" && index < 3)) {
      content += `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <strong>Input:</strong>
                        <pre class="bg-gray-100 p-2 rounded mt-1">${testResult.input || "No input"}</pre>
                    </div>
                    <div>
                        <strong>Expected:</strong>
                        <pre class="bg-gray-100 p-2 rounded mt-1">${testResult.expectedOutput}</pre>
                    </div>
                    <div>
                        <strong>Your Output:</strong>
                        <pre class="bg-gray-100 p-2 rounded mt-1">${testResult.actualOutput || "No output"}</pre>
                    </div>
                </div>
            `
    }

    testDiv.innerHTML = content
    container.appendChild(testDiv)
  })
}

// Utility Functions
function getDifficultyClass(difficulty) {
  switch (difficulty) {
    case "EASY":
      return "bg-green-200 text-green-800"
    case "MEDIUM":
      return "bg-yellow-200 text-yellow-800"
    case "HARD":
      return "bg-red-200 text-red-800"
    default:
      return "bg-gray-200 text-gray-800"
  }
}

function getMarksPerTestCase(difficulty) {
  switch (difficulty) {
    case "EASY":
      return 2
    case "MEDIUM":
      return 3
    case "HARD":
      return 5
    default:
      return 1
  }
}

function showLoading(show) {
  const spinner = document.getElementById("loadingSpinner")
  if (show) {
    spinner.classList.remove("hidden")
    spinner.classList.add("flex")
  } else {
    spinner.classList.add("hidden")
    spinner.classList.remove("flex")
  }
}

// Global functions for admin actions
window.editQuestion = async (questionId) => {
  openQuestionModal(questionId)
}

window.deleteQuestion = deleteQuestion

// Declare loadQuestionForEdit function if it doesn't exist
async function loadQuestionForEdit(questionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/questions/${questionId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
    const question = await response.json()

    document.getElementById("questionId").value = question.id
    document.getElementById("questionTitle").value = question.title
    document.getElementById("questionDescription").value = question.description
    document.getElementById("questionDifficulty").value = question.difficulty
    document.getElementById("questionInputFormat").value = question.inputFormatType
    document.getElementById("questionReturnType").value = question.returnType // Set return type

    // Populate parameters
    const parametersList = document.getElementById("parametersList")
    parametersList.innerHTML = "" // Clear existing parameters
    if (question.parameters && question.parameters.length > 0) {
      question.parameters.forEach((p) => addParameterRow(p.type, p.name))
    } else {
      addParameterRow() // Add a default one if none exist
    }

    const testCasesList = document.getElementById("testCasesList")
    testCasesList.innerHTML = "" // Clear existing test cases

    question.testCases.forEach((tc) => {
      const testCaseDiv = document.createElement("div")
      testCaseDiv.className = "border border-gray-200 rounded p-3"
      testCaseDiv.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Input</label>
                        <textarea class="testcase-input mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" rows="3">${tc.input || ""}</textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Expected Output</label>
                        <textarea class="testcase-output mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" rows="3" required>${tc.expectedOutput}</textarea>
                    </div>
                </div>
                <div class="flex justify-between items-center mt-2">
                    <label class="flex items-center">
                        <input type="checkbox" class="testcase-public mr-2" ${tc.isPublic ? "checked" : ""}>
                        <span class="text-sm">Public Test Case</span>
                    </label>
                    <button type="button" onclick="this.parentElement.parentElement.remove()" class="text-red-600 hover:text-red-800 text-sm">Remove</button>
                </div>
            `
      testCasesList.appendChild(testCaseDiv)
    })
  } catch (error) {
    console.error("Error loading question for edit:", error)
    alert("Error loading question for edit: " + error.message)
  }
}

// This function seems to be a duplicate of handleQuestionSubmit's logic for creating a question.
// It's likely intended for a different context or should be removed if not used.
// For now, keeping it as it was in the original code, but it might be redundant.
function createQuestion() {
  const questionData = {
    title: document.getElementById("questionTitle").value,
    description: document.getElementById("questionDescription").value,
    difficulty: document.getElementById("questionDifficulty").value,
    inputFormatType: document.getElementById("questionInputFormat").value,
    testCases: [],
  }

  // Collect test cases
  const testCaseRows = document.querySelectorAll("#testCasesList > div")
  testCaseRows.forEach((row) => {
    const input = row.querySelector(".testcase-input").value
    const expectedOutput = row.querySelector(".testcase-output").value
    const isPublic = row.querySelector(".testcase-public").checked
    if (input && expectedOutput) {
      questionData.testCases.push({
        input: input,
        expectedOutput: expectedOutput,
        isPublic: isPublic,
      })
    }
  })

  return questionData
}

// This function is a duplicate of the one defined earlier. Removing the duplicate.
// function displayAdminQuestions(questions) {
//   allQuestions = questions
//   filteredQuestions = questions

//   // Update stats
//   document.getElementById("totalQuestions").textContent = questions.length
//   document.getElementById("easyQuestions").textContent = questions.filter((q) => q.difficulty === "EASY").length
//   document.getElementById("hardQuestions").textContent = questions.filter((q) => q.difficulty === "HARD").length

//   renderQuestionsList(filteredQuestions)
// }

// This function is a duplicate of the one defined earlier. Removing the duplicate.
// function renderQuestionsList(questions) {
//   const container = document.getElementById("questionsList")
//   container.innerHTML = ""

//   if (questions.length === 0) {
//     container.innerHTML = `
//             <div class="text-center py-12 text-gray-500">
//                 <i class="fas fa-question-circle text-6xl mb-4"></i>
//                 <h3 class="text-xl font-semibold mb-2">No Questions Found</h3>
//                 <p>Create your first coding question to get started!</p>
//             </div>
//         `
//     return
//   }

//   questions.forEach((question) => {
//     const difficultyClass = getDifficultyClass(question.difficulty)
//     const questionCard = document.createElement("div")
//     questionCard.className = "bg-white border border-gray-200 rounded-xl p-6 card-hover"
//     questionCard.innerHTML = `
//             <div class="flex justify-between items-start mb-4">
//                 <div class="flex-1">
//                     <h3 class="text-xl font-semibold text-gray-800 mb-2">${question.title}</h3>
//                     <p class="text-gray-600 mb-3 line-clamp-2">${question.description.substring(0, 150)}${question.description.length > 150 ? "..." : ""}</p>
//                     <div class="flex items-center space-x-4 text-sm">
//                         <span class="${difficultyClass} px-3 py-1 rounded-full text-xs font-medium">
//                             ${question.difficulty}
//                         </span>
//                         <span class="text-gray-500">
//                             <i class="fas fa-keyboard mr-1"></i>
//                             Input: ${question.inputFormatType.replace(/_/g, " ")}
//                         </span>
//                     </div>
//                 </div>
//                 <div class="flex flex-col space-y-2 ml-4">
//                     <button onclick="editQuestion(${question.id})" class="text-blue-600 hover:text-blue-800 px-3 py-2 rounded-lg hover:bg-blue-50 transition-all duration-300">
//                         <i class="fas fa-edit mr-1"></i>Edit
//                     </button>
//                     <button onclick="deleteQuestion(${question.id})" class="text-red-600 hover:text-red-800 px-3 py-2 rounded-lg hover:bg-red-50 transition-all duration-300">
//                         <i class="fas fa-trash mr-1"></i>Delete
//                     </button>
//                 </div>
//             </div>
//             <div class="flex justify-between items-center pt-4 border-t border-gray-100">
//                 <div class="text-sm text-gray-500">
//                     <i class="fas fa-vial mr-1"></i>
//                     ${question.testCases ? question.testCases.length : 0} test cases
//                 </div>
//                 <div class="text-sm text-gray-500">
//                     Created: ${new Date(question.createdAt).toLocaleDateString()}
//                 </div>
//             </div>
//         `
//     container.appendChild(questionCard)
//   })
// }

function setupCodeEditor(selectedLanguage) {
  if (!currentQuestion) {
    console.error("No current question selected")
    return
  }

  let mode = "python"
  let defaultCode = ""

  switch (selectedLanguage) {
    case "71": // Python
      mode = "python"
      defaultCode = `# Write your Python code here
# Read input and solve the problem
# Print the output

`
      break
    case "62": // Java
      mode = "text/x-java"
      defaultCode = `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));

        // Write your Java code here
        // Read input and solve the problem
        // Print the output

        reader.close();
    }
}
`
      break
    case "54": // C++
      mode = "text/x-c++src"
      defaultCode = `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

int main() {
    // Write your C++ code here
    // Read input and solve the problem
    // Print the output

    return 0;
}
`
      break
    case "50": // C
      mode = "text/x-csrc"
      defaultCode = `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    // Write your C code here
    // Read input and solve the problem
    // Print the output

    return 0;
}
`
      break
    case "63": // JavaScript
      mode = "javascript"
      defaultCode = `const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Write your JavaScript code here
// Read input and solve the problem
// Print the output

`
      break
  }

  if (codeEditor) {
    codeEditor.setOption("mode", mode)
    codeEditor.setValue(defaultCode)
  }
}

// The addTestCase function was undeclared. Assuming it's a helper for populating test cases in the edit modal.
// Re-implementing it based on the usage in editQuestion.
function addTestCase(input = "", expectedOutput = "", isPublic = false) {
  const testCasesList = document.getElementById("testCasesList")
  const testCaseDiv = document.createElement("div")
  testCaseDiv.className = "bg-white border border-gray-200 rounded-lg p-4 mb-4 animate-fade-in"
  testCaseDiv.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                    <i class="fas fa-keyboard mr-2"></i>Input
                </label>
                <textarea class="testcase-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" rows="3" placeholder="Enter test input...">${input}</textarea>
            </div>
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                    <i class="fas fa-check-circle mr-2"></i>Expected Output
                </label>
                <textarea class="testcase-output w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" rows="3" placeholder="Enter expected output..." required>${expectedOutput}</textarea>
            </div>
        </div>
        <div class="flex justify-between items-center">
            <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" class="testcase-public w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" ${isPublic ? "checked" : ""}>
                <span class="text-sm font-medium text-gray-700">
                    <i class="fas fa-eye mr-1"></i>Public Test Case
                </span>
            </label>
            <button type="button" onclick="this.parentElement.parentElement.remove()" class="text-red-600 hover:text-red-800 px-3 py-2 rounded-lg hover:bg-red-50 transition-all duration-300">
                <i class="fas fa-trash mr-1"></i>Remove
            </button>
        </div>
    `
  testCasesList.appendChild(testCaseDiv)
}

async function editQuestion(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/questions/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
    const question = await response.json()

    // Populate form fields
    document.getElementById("questionId").value = question.id
    document.getElementById("questionTitle").value = question.title
    document.getElementById("questionDescription").value = question.description
    document.getElementById("questionDifficulty").value = question.difficulty
    document.getElementById("questionInputFormat").value = question.inputFormatType
    document.getElementById("questionReturnType").value = question.returnType // Set return type

    // Populate parameters
    const parametersList = document.getElementById("parametersList")
    parametersList.innerHTML = "" // Clear existing parameters
    if (question.parameters && question.parameters.length > 0) {
      question.parameters.forEach((p) => addParameterRow(p.type, p.name))
    } else {
      addParameterRow() // Add a default one if none exist
    }

    // Populate test cases
    const testCasesList = document.getElementById("testCasesList")
    testCasesList.innerHTML = "" // Clear existing test cases
    if (question.testCases && question.testCases.length > 0) {
      question.testCases.forEach((tc) => addTestCase(tc.input, tc.expectedOutput, tc.isPublic))
    } else {
      addTestCase() // Add a default one if none exist
    }

    // Show modal
    document.getElementById("modalTitle").innerHTML = '<i class="fas fa-edit mr-2"></i>Edit Question'
    document.getElementById("questionModal").classList.remove("hidden")
    document.getElementById("questionModal").classList.add("flex")
  } catch (error) {
    console.error("Error loading question:", error)
    showNotification("Error loading question", "error")
  }
}
