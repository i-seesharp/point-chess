const express = require("express");
const uuid = require("uuid");
const path = require("path");
const http = require("http");
const session = require("express-session");
const ejs = require("ejs");
const flash = require("connect-flash");
const bodyParser = require("body-parser");
const socketio = require("socket.io");
const { Chess } = require("chess.js");
const passport = require("passport");

const boardConfig = require(path.join(__dirname, "config", "board-config.js"));

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 3000;


app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended : true }));

app.use(session({
    secret: "pOiNtChEsS",
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

var games = {};


io.on("connection", (socket) => {
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
            kingSquare: boardConfig.get_position(games[currentRoom], {type: "k", color:games[currentRoom].turn()})
        }

        io.to(currentRoom).emit("change", games[currentRoom].fen(), oldPos, moveObj, checkObj);
        if(games[currentRoom].game_over()){
            if(games[currentRoom].in_checkmate()){
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
        opponentSocket.emit("game-over", "draw", "no-winner");
        socket.emit("game-over", "draw", "no-winner");

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
                opponentSocket.emit("game-over", "abandonment", opponentSocket.id);
                console.log("A player left their game.");
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

app.get("/", (req, res)=>{
    res.render("index");
});

app.get("/play", (req, res) => {
    res.render("play");
});

server.listen(PORT, () => {
    console.log("Server listening for connections on port", PORT);
})