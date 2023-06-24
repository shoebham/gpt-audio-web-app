// Connect to the Socket.IO server
const socket = io();

// Get DOM elements
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const transcriptDiv = document.getElementById("transcript");
const helperDiv = document.getElementById("helper");
const speakButton = document.getElementById("speakButton");
const responseDiv = document.getElementById("gpt-response");
const messageDiv = document.getElementById("messages");
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
  // Silence timeout in milliseconds

  // Start speech recognition
  startButton.addEventListener("click", () => {
    helperDiv.innerHTML = "";
    recognition.start();
  });

  recognition.onstart = () => {
    console.log("Speech recognition started");
    transcript = "";
  };

  // this works for every audio event that is detected
  recognition.onresult = (event) => {
    transcript = Array.from(event.results)
      .map((result) => result[0].transcript)
      .join("");

    console.log("Transcript:", transcript);
    document.getElementById("user-input").value = transcript;

    console.log(i++);
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
  responseDiv.innerHTML = "GPT response:" + response;

  addToChat(transcript, response); // Add the question and response to the chat view
  speak();
  startButton.disabled = false;
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});

function stopRecognition() {
  if (isRecognitionStopped) return;
  // clear time out if speechtimeoutid is defined
  if (speechTimeoutId) clearTimeout(speechTimeoutId);
  isRecognitionStopped = true;

  helperDiv.innerHTML = "Detected silence for 5 seconds, so processing speech";
  socket.emit("voiceInput", transcript);
  console.log("Speech recognition ended");
}
function speak() {
  const responseText = responseDiv.textContent;

  // Create a new SpeechSynthesisUtterance
  const speechUtterance = new SpeechSynthesisUtterance(responseText);

  // Speak the response
  startButton.disabled = true;
  speechSynthesis.speak(speechUtterance);
}

function addToChat(question, response) {
  chat.push({
    question: transcript,
    response: response,
  });
  const message = document.createElement("div");
  message.id = "message";
  const questionDiv = document.createElement("div");
  questionDiv.id = "question";
  const responseDiv = document.createElement("div");
  responseDiv.id = "response";
  questionDiv.innerHTML = `<p><strong>Question:</strong> ${question}</p>`;
  responseDiv.innerHTML = `<p><strong>Response:</strong> ${response}</p>`;
  message.appendChild(questionDiv);
  message.appendChild(responseDiv);
  messageDiv.appendChild(message);
}
