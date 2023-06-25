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

// when page loads
window.onload = function () {
  textInput.focus();
  disableBtn(muteBtn, true);
  disableBtn(stopBtn, true);
  speechSynthesis.cancel();
};

muteBtn.addEventListener("click", () => {
  speechSynthesis.cancel();
  disableBtn(muteBtn, true);
  disableBtn(speakBtn, false);
  disableBtn(stopBtn, true);
  disableBtn(userInput, false);
});

// Speech recognition variables
let recognition;
let transcript = "";
let isRecognitionStopped = false;

// Check if browser supports SpeechRecognition
if ("webkitSpeechRecognition" in window) {
  // set recognition properties
  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";
  let inputText = "";

  // when send button is pressed
  sendBtn.addEventListener("click", () => {
    helperMessage("");
    helperMessage("Processing...");
    console.log("Stop recognition when send button is pressed");
    stopRecognition();
  });

  // for speech to text
  speakBtn.addEventListener("click", () => {
    helperMessage("");
    disableBtn(stopBtn, false);
    disableBtn(speakBtn, true);
    recognition.start();
  });

  // enable other buttons when stop is pressed
  stopBtn.addEventListener("click", () => {
    if (speechTimeoutId) clearTimeout(speechTimeoutId);
    disableBtn(stopBtn, true);
    disableBtn(speakBtn, false);
    disableBtn(sendBtn, false);
    disableBtn(muteBtn, true);
  });

  // clear old value before starting
  recognition.onstart = () => {
    console.log("Speech recognition started");
    transcript = "";
    inputText = textInput.value;
  };

  // this works for every audio event that is detected
  recognition.onresult = (event) => {
    helperMessage("Listening...");
    transcript = Array.from(event.results)
      .map((result) => result[0].transcript)
      .join("");

    console.log("Transcript:", transcript);
    textInput.value = inputText + transcript;
    if (speechTimeoutId) clearTimeout(speechTimeoutId);
    // stop after 5 seconds of silence
    speechTimeoutId = setTimeout(() => {
      helperMessage("Detected silence, processing speech...");
      stopRecognition();
    }, silenceTimeout);
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
  };

  recognition.onend = () => {
    console.log("Speech recognition ended");
    if (!isRecognitionStopped) {
      stopRecognition();
    }
  };
} else {
  console.error("Speech recognition not supported");
}

socket.on("connect", () => {
  console.log("Connected to server");
});
socket.on("disconnect", () => {
  console.log("Disconnected from server");
});

// when server sends audio response
socket.on("audioResponse", (response) => {
  console.log("Audio response:", response);
  clearInput();
  addToChat(transcript, response);
  speak(response);
  disableBtn(muteBtn, false);
  transcript = "";
});

function stopRecognition() {
  if (!isRecognitionStopped) recognition.stop();
  if (speechTimeoutId) clearTimeout(speechTimeoutId);
  isRecognitionStopped = true;
  disableAll();
  transcript = textInput.value;
  socket.emit("voiceInput", transcript);
  clearInput();
}

function disableAll() {
  disableBtn(textInput, true);
  disableBtn(stopBtn, true);
  disableBtn(speakBtn, true);
  disableBtn(sendBtn, true);
}

function speak(responseText) {
  var speechUtterance;
  speechUtterance = new SpeechSynthesisUtterance(responseText);
  utterances.push(speechUtterance);
  // when text-to-speech event ends
  speechUtterance.onend = () => {
    console.log("Speech finished");
    disableBtn(textInput, false);
    disableBtn(speakBtn, false);
    disableBtn(sendBtn, false);
    disableBtn(stopBtn, true);
    clearInput();
    muteBtn.disabled = true;
  };
  // Speak the response
  speechSynthesis.speak(speechUtterance);
}

function addToChat(question, response) {
  // sanitize question
  question = question.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // sanitize response
  response = response.replace(/</g, "&lt;").replace(/>/g, "&gt;");

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
  // add after last message
  const lastMessage = messagesDiv.childNodes[messagesDiv.childElementCount - 1];
  if (lastMessage) lastMessage.appendChild(message);
  else messagesDiv.appendChild(message);
}

function checkInput() {
  if (userInput.value.trim().length > 0) {
    sendBtn.disabled = false; // Enable the send button if there is text
  } else {
    sendBtn.disabled = true; // Disable the send button if there is no text
  }
}

function enableBtns() {
  speakBtn.disabled = false;
  sendBtn.disabled = false;
}

function disableBtn(btn, val) {
  btn.disabled = val;
}

function helperMessage(message) {
  helperDiv.innerHTML = message;
}
function clearInput() {
  helperMessage("");
  textInput.value = "";
}
