const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 3000;
const playingRoom = "playing-room";

app.use(express.static(path.join(__dirname, 'public')));

io.on("connection", (socket) => {
    console.log("A new user has connected.");
    socket.join("lobby-room");
    var lobby = Array.from(io.sockets.adapter.rooms.get("lobby-room"));
    
    if(lobby.length % 2 == 0){
        socket.leave("lobby-room");
        lobby = Array.from(io.sockets.adapter.rooms.get("lobby-room"));
        let socketId = lobby[Math.floor(Math.random()*lobby.length)];
        let randomSocket = io.sockets.sockets.get(socketId);

        randomSocket.leave("lobby-room");
        
        randomSocket.join(playingRoom);
        socket.join(playingRoom);

        let randomNumber = Math.floor(Math.random()*2);
        
        if (randomNumber === 0){
            io.to(playingRoom).emit("play", playingRoom, socket.id);
        }
        else{
            io.to(playingRoom).emit("play", playingRoom, randomSocket.id);
        }  
    }
    
    socket.on("move", newPos => {
        console.log("A move was played");
        io.emit("change",newPos); 
    });
    
    
});

server.listen(PORT, () => {
    console.log("Server listening for connections on port", PORT);
})