const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const fs = require("fs");

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

const port = 3000;
http.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
