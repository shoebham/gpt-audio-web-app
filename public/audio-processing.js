const socket = io();

// dom elements
const speakBtn = document.getElementById("speakBtn");
const stopButton = document.getElementById("stopButton");
const transcriptDiv = document.getElementById("transcript");
const helperDiv = document.getElementById("helperText");
const speakButton = document.getElementById("speakButton");
const responseDiv = document.getElementById("gpt-response");
const messagesDiv = document.getElementById("messages");
const textInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const muteBtn = document.getElementById("muteBtn");
const stopBtn = document.getElementById("stopBtn");

window.utterances = [];
let speechTimeoutId;
const silenceTimeout = 5000;
var chat = [
  {
    question: "",
    response: "",
  },
];

// when page loads
window.onload = function () {
  textInput.focus();
  muteBtn.disabled = true;
  stopBtn.disabled = true;
  speechSynthesis.cancel();
};

muteBtn.addEventListener("click", () => {
  speechSynthesis.cancel();
  enableBtns();
});

// Speech recognition variables
let recognition;
let transcript = "";
let isRecognitionStopped = false;
var i = 1;
// Check if browser supports SpeechRecognition
if ("webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";
  let inputText = "";
  // Silence timeout in milliseconds

  sendBtn.addEventListener("click", () => {
    helperDiv.innerHTML = "";
    transcript = textInput.value;
    stopRecognitionWhenSendButtonIsPressed();
  });

  // Start speech recognition
  speakBtn.addEventListener("click", () => {
    helperDiv.innerHTML = "";
    stopBtn.disabled = false;
    speakBtn.disabled = true;
    recognition.start();
  });

  stopBtn.addEventListener("click", () => {
    stopRecognition();
  });

  recognition.onstart = () => {
    console.log("Speech recognition started");
    transcript = "";
    inputText = textInput.value;
  };

  // this works for every audio event that is detected
  recognition.onresult = (event) => {
    helperDiv.innerHTML = "Listening...";
    transcript = Array.from(event.results)
      .map((result) => result[0].transcript)
      .join("");

    console.log("Transcript:", transcript);
    textInput.value = inputText + transcript;

    speechTimeoutId = setTimeout(() => {
      stopRecognition();
    }, silenceTimeout);
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
  };

  recognition.onend = () => {
    console.log("Speech recognition ended");
    stopRecognition();
  };
} else {
  console.error("Speech recognition not supported");
}

// Socket.IO event listeners
socket.on("connect", () => {
  console.log("Connected to server");
});

socket.on("audioResponse", (response) => {
  helperDiv.innerHTML = "";
  console.log("Audio response:", response);
  textInput.value = "";
  addToChat(transcript, response);
  speak(response);
  muteBtn.disabled = false;
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});

function stopRecognition() {
  if (isRecognitionStopped) return;
  // clear time out if speechtimeoutid is defined
  if (speechTimeoutId) clearTimeout(speechTimeoutId);
  isRecognitionStopped = true;

  helperDiv.innerHTML = "Detected silence, processing speech...";
  disableBtns();
  socket.emit("voiceInput", transcript);
}
function stopRecognitionWhenSendButtonIsPressed() {
  if (speechTimeoutId) clearTimeout(speechTimeoutId);
  isRecognitionStopped = true;

  helperDiv.innerHTML = "Processing";
  disableBtns();
  socket.emit("voiceInput", transcript);
}
function speak(responseText) {
  // Create a new SpeechSynthesisUtterance
  var speechUtterance;

  speechUtterance = new SpeechSynthesisUtterance(responseText);
  utterances.push(speechUtterance);
  speechUtterance.onend = () => {
    console.log("Speech finished");
    enableBtns();
    muteBtn.disabled = true;
  };
  // Speak the response
  speechSynthesis.speak(speechUtterance);
}

function addToChat(question, response) {
  chat.push({
    question: transcript,
    response: response,
  });
  const message = document.createElement("div");
  const questionDiv = document.createElement("div");
  const answerDiv = document.createElement("div");
  const hr = document.createElement("hr");
  message.classList = "message";
  questionDiv.classList = "question";
  answerDiv.classList = "response";
  questionDiv.innerHTML = `<p><strong>Question:</strong> ${question}</p>`;
  answerDiv.innerHTML = `<p><strong>Response:</strong> ${response}</p>`;
  message.appendChild(questionDiv);
  message.appendChild(answerDiv);
  message.appendChild(hr);

  const lastMessage = messagesDiv.lastChild;
  if (lastMessage.classList == "message")
    lastMessage.insertBefore(message, lastMessage.nextSibling);
  else messagesDiv.appendChild(message);
}

function disableBtns() {
  speakBtn.disabled = true;
  sendBtn.disabled = true;
  stopBtn.disabled = true;
}

function enableBtns() {
  speakBtn.disabled = false;
  sendBtn.disabled = false;
}
