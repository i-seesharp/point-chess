const { Chess } = require("chess.js");
const socketio = require("socket.io");
const uuid = require("uuid");
const path = require("path");
const boardConfig = require(path.join("..", "config", "board-config.js"));


var socketCommunication = (io) => {
    var games = {};
    var idToName = {};
    io.on("connection", (socket) => {

        socket.on("my-name", (username) => {
            idToName[socket.id] = username;
            console.log("A new user has joined the lobby.");
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
                    io.to(playingRoom).emit("play", playingRoom, socket.id, idToName[socket.id], idToName[randomSocket.id]);
                }
                else{
                    io.to(playingRoom).emit("play", playingRoom, randomSocket.id, idToName[randomSocket.id], idToName[socket.id]);
                }
                games[playingRoom] = {
                    game: new Chess(),
                    isOver: false
                };
                
            }
        });
        
        
    
        socket.on("move", (moveObj, oldPos, piece) => {
            console.log("A move was played");
            var currentRoom = Array.from(socket.rooms)[Array.from(socket.rooms).length - 1];
            if((piece === "wP" && moveObj.to[moveObj.to.length -1] == "8") || (piece === "bP" && moveObj.to[moveObj.to.length-1] == "1")){
                moveObj.promotion = "q";
            }
            var status = games[currentRoom].game.move(moveObj)
            console.log(moveObj, status);
            if (status === null){
                console.log(games[currentRoom].game.moves({square : moveObj.from}));
            }
            
            var checkObj = {
                inCheck: games[currentRoom].game.in_check(),
                kingSquare: boardConfig.get_position(games[currentRoom].game, {type: "k", color:games[currentRoom].game.turn()})
            }
    
            io.to(currentRoom).emit("change", games[currentRoom].game.fen(), oldPos, moveObj, checkObj);
            if(games[currentRoom].game.game_over()){
                games[currentRoom].isOver = true;
                if(games[currentRoom].game.in_checkmate()){
                    io.to(currentRoom).emit("checkmate", socket.id);
                }else{
                    io.to(currentRoom).emit("draw-over");
                }
            }
             
        });
    
        socket.on("draw", () => {
            var gameRoom = Array.from(socket.rooms)[1];
            var playersInRoom = Array.from(io.sockets.adapter.rooms.get(gameRoom));
            
            for(var i = 0; playersInRoom.length; i++){
                if(playersInRoom[i] !== Array.from(socket.rooms)[0]){
                    break
                }
            }
            var opponentSocket = io.sockets.sockets.get(playersInRoom[i]);
            opponentSocket.emit("draw-offer");
            
    
        });
    
        socket.on("accept-draw", () => {
            var gameRoom = Array.from(socket.rooms)[1];
            games[gameRoom].isOver = true;
            io.to(gameRoom).emit("draw-over");
        });
    
        socket.on("resign", () => {
            var gameRoom = Array.from(socket.rooms)[1];
            var playersInRoom = Array.from(io.sockets.adapter.rooms.get(gameRoom));
            
            for(var i = 0; playersInRoom.length; i++){
                if(playersInRoom[i] !== Array.from(socket.rooms)[0]){
                    break
                }
            }
            var opponentSocket = io.sockets.sockets.get(playersInRoom[i]);
            games[gameRoom].isOver = true;
            opponentSocket.emit("game-over", "resignation", opponentSocket.id);
            socket.emit("game-over", "resignation", opponentSocket.id);
        });
        
        socket.on("disconnecting", () => {
            var roomLeft = Array.from(socket.rooms)[1];
            if(roomLeft !== "lobby-room"){
                var playersInRoom = Array.from(io.sockets.adapter.rooms.get(roomLeft));
                var alone = true;
                for(var i = 0; i < playersInRoom.length; i++){
                    if(playersInRoom[i] !== Array.from(socket.rooms)[0]){
                        alone = false;
                        break;
                    }
                }
                if(alone !== true){
                    var opponentSocket = io.sockets.sockets.get(playersInRoom[i]);
                    if(!games[roomLeft].isOver){
                        opponentSocket.emit("game-over", "abandonment", opponentSocket.id);
                        console.log("A player left their game.");
                    }
                    
                    console.log(games);
                }else{
                    delete games[roomLeft];
                    console.log(games);
                }
           
            }else{
                console.log("A player left the lobby.");
            }
     
        });
    });
}

module.exports = socketCommunication;