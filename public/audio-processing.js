// Connect to the Socket.IO server
const socket = io();

// Get DOM elements
const speakBtn = document.getElementById("speakBtn");
const stopButton = document.getElementById("stopButton");
const transcriptDiv = document.getElementById("transcript");
const helperDiv = document.getElementById("helper");
const speakButton = document.getElementById("speakButton");
const responseDiv = document.getElementById("gpt-response");
const messageDiv = document.getElementById("messages");
const textInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
let speechTimeoutId;
const silenceTimeout = 5000;
var chat = [
  {
    question: "",
    response: "",
  },
];
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

  // Start speech recognition
  speakBtn.addEventListener("click", () => {
    helperDiv.innerHTML = "";
    recognition.start();
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
    preProcessingBeforeResponse();
    // create a sending animation with ...
    // helperDiv.innerHTML = "Sending to GPT-3...";
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
  addToChat(transcript, response); // Add the question and response to the chat view
  speak(response);
});

function preProcessingBeforeResponse() {
  speakBtn.disabled = true;
  sendBtn.disabled = true;
}
function postProcessingAfterResponse() {
  speakBtn.disabled = false;
  sendBtn.disabled = false;
  textInput.value = "";
}
socket.on("disconnect", () => {
  console.log("Disconnected from server");
});

function stopRecognition() {
  if (isRecognitionStopped) return;
  // clear time out if speechtimeoutid is defined
  if (speechTimeoutId) clearTimeout(speechTimeoutId);
  isRecognitionStopped = true;

  helperDiv.innerHTML = "Detected silence, processing speech...";
  socket.emit("voiceInput", transcript);
}
function speak(responseText) {
  // Create a new SpeechSynthesisUtterance
  const speechUtterance = new SpeechSynthesisUtterance(responseText);

  // Speak the response

  speechSynthesis.speak(speechUtterance);
}

function addToChat(question, response) {
  chat.push({
    question: transcript,
    response: response,
  });
  const message = document.createElement("div");
  message.class = "message";
  const questionDiv = document.createElement("div");
  questionDiv.id = "question";
  const answerDiv = document.createElement("div");
  answerDiv.id = "response";
  questionDiv.innerHTML = `<p><strong>Question:</strong> ${question}</p>`;
  answerDiv.innerHTML = `<p><strong>Response:</strong> ${response}</p>`;
  message.appendChild(questionDiv);
  message.appendChild(answerDiv);
  messageDiv.appendChild(message);
}
