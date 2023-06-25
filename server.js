const express = require("express");
const fs = require("fs");
// const options = {
//   key: fs.readFileSync("server.key"),
//   cert: fs.readFileSync("server.cert"),
// };
const app = express();
const http = require("http").createServer(app);
// const https = require("https").createServer(options, app);
const io = require("socket.io")(http);
const axios = require("axios");

const env = require("dotenv").config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const cors = require("cors");
const bodyParser = require("body-parser");

const Pusher = require("pusher");

const pusher = new Pusher({
  appId: "1624430",
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: "ap2",
  useTLS: true,
});
async function initializePusher() {
  return new Promise((resolve, reject) => {
    pusher.connection.bind("connected", resolve);
    pusher.connection.bind("failed", reject);
    pusher.connect();
  });
}
app.use(express.static(__dirname + "/public/"));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Enable CORS for all routes
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// socket.on("voiceInput", async (transcript) => {
app.post("/pusher/webhook", async (req, res) => {
  console.log(req);
  const transcript = req.body.transcript;
  console.log("Received voice input:", transcript);

  try {
    // Send the transcript to OpenAI API as a prompt
    // Send the transcript to OpenAI API as a prompt
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: transcript },
      ],
    });

    let botResponse = completion.data.choices[0].message.content;
    console.log(botResponse);
    // Convert the bot response to speech using text-to-speech library or service of your choice
    // Send the audio response back to the client
    // socket.emit("audioResponse", botResponse);
    pusher.trigger("chat-channel", "audio-response", {
      botResponse: botResponse,
    });
    res.sendStatus(200).end();
  } catch (error) {
    console.error("OpenAI API error:", error);
  }
});

initializePusher()
  .then(() => {
    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch((error) => {
    console.error("Pusher connection failed:", error);
  });
const port = 3000;
http.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
