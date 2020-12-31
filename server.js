const express = require("express");
const uuid = require("uuid");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const { Chess } = require("chess.js");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 3000;


app.use(express.static(path.join(__dirname, 'public')));

var games = {};
const get_piece_positions = (game, piece) => {
    return [].concat(...game.board()).map((p, index) => {
      if (p !== null && p.type === piece.type && p.color === piece.color) {
        return index;
      }
    }).filter(Number.isInteger).map((piece_index) => {
      const row = 'abcdefgh'[piece_index % 8]
      const column = Math.ceil((64 - piece_index) / 8);
      return row + column;
    });
  }
io.on("connection", (socket) => {
    console.log("A new user has connected.");
    socket.join("lobby-room");
    var lobby = Array.from(io.sockets.adapter.rooms.get("lobby-room"));
    
    if(lobby.length % 2 == 0){
        socket.leave("lobby-room");
        lobby = Array.from(io.sockets.adapter.rooms.get("lobby-room"));
        let socketId = lobby[Math.floor(Math.random()*lobby.length)];
        let randomSocket = io.sockets.sockets.get(socketId);
        let playingRoom = uuid.v4();

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
        games[playingRoom] = new Chess();
        
    }
    
    socket.on("move", (moveObj, oldPos, piece) => {
        console.log("A move was played");
        var currentRoom = Array.from(socket.rooms)[Array.from(socket.rooms).length - 1];
        if((piece === "wP" && moveObj.to[moveObj.to.length -1] == "8") || (piece === "bP" && moveObj.to[moveObj.to.length-1] == "1")){
            moveObj.promotion = "q";
        }
        var status = games[currentRoom].move(moveObj)
        console.log(moveObj, status);
        if (status === null){
            console.log(games[currentRoom].moves({square : moveObj.from}));
        }
        
        var checkObj = {
            inCheck: games[currentRoom].in_check(),
            kingSquare: get_piece_positions(games[currentRoom], {type: "k", color:games[currentRoom].turn()})
        }

        io.to(currentRoom).emit("change", games[currentRoom].fen(), oldPos, moveObj, checkObj);
         
    });
    
    
});

server.listen(PORT, () => {
    console.log("Server listening for connections on port", PORT);
})