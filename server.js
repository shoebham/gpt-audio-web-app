const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const fs = require("fs");
const axios = require("axios");

const env = require("dotenv").config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("voiceInput", async (transcript) => {
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
      socket.emit("audioResponse", botResponse);
    } catch (error) {
      console.error("OpenAI API error:", completion.data.choices[0].message);
    }
  });
});

const port = 3000;
http.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
