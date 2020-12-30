const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

io.on("connection", (socket) => {
    console.log("A new user has connected.");
    socket.on("move", newPos => {
        console.log("A move was played");
        io.emit("change",newPos); 
    });
});

server.listen(PORT, () => {
    console.log("Server listening for connections on port", PORT);
})