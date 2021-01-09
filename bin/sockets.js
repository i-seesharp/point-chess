const { Chess } = require("chess.js");
const socketio = require("socket.io");
const uuid = require("uuid");
const path = require("path");
const boardConfig = require(path.join("..", "config", "board-config.js"));
const client = require("mongodb").MongoClient;
const { SSL_OP_EPHEMERAL_RSA } = require("constants");
const url = "mongodb://localhost:27017/";
const ratings = require(path.join(__dirname, "ratings.js"));


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
        
        socket.on("get-ratings", () => {
            var username = idToName[socket.id];
            var rating = 1500;
            var gameRoom = Array.from(socket.rooms)[1];
            var playersInRoom = Array.from(io.sockets.adapter.rooms.get(gameRoom));
            var opponentSocketId;
            for(var i=0; i < playersInRoom.length; i++){
                if (playersInRoom[i] != socket.id){
                    opponentSocketId = playersInRoom[i];
                    break;
                }
            }
            var opponentSocket = io.sockets.sockets.get(playersInRoom[i]);
            client.connect(url, (err, db) => {
                if (err) throw err;
                var dbo = db.db("point-chess");
                var query = {username: username};

                dbo.collection("ratings").findOne(query, (err, ratingObj) => {
                    if (err) throw err;
                    if (!ratingObj){
                        throw new Error("This user has no rating object.");
                    }else{
                        rating = ratingObj.rating;
                        socket.emit("rating", rating, "my-name");
                    }
                });
                
                dbo.collection("ratings").findOne({username: idToName[opponentSocketId]}, (err, ratingObj) => {
                    if (err) throw err;
                    if (!ratingObj){
                        throw new Error("This user has no rating object.");
                    }else{
                        rating = ratingObj.rating;
                        socket.emit("rating", rating, "opponent-name");
                    }
                });
                
            });
            
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

        socket.on("update-ratings", (myStatus) => {
            var username = idToName[socket.id];
            var gameRoom = Array.from(socket.rooms)[1];
            var playersInRoom = Array.from(io.sockets.adapter.rooms.get(gameRoom));
            console.log("here");
            for(var i = 0; playersInRoom.length; i++){
                if(playersInRoom[i] !== Array.from(socket.rooms)[0]){
                    break
                }
            }
            var opponentSocket = io.sockets.sockets.get(playersInRoom[i]);
            var oppUsername = idToName[opponentSocket.id];
            client.connect(url, (err, db) => {
                if (err) throw err;
                var dbo = db.db("point-chess");
                var query = {username: username};

                dbo.collection("ratings").findOne(query, (err, ratingObj) => {
                    if (err) throw err;
                    var player = ratings.makePlayer(ratingObj.rating, ratingObj.rd, ratingObj.vol);
                    dbo.collection("ratings").findOne({username: oppUsername}, (err, obj) => {
                        if (err) throw err;
                        console.log("made it here");
                        var opp = ratings.makePlayer(obj.rating, obj.rd, obj.vol);
                        ratings.updateRatings([[player, opp, myStatus]]);
                        var myObj = {
                            username: ratingObj.username,
                            rating: Math.floor(player.getRating()),
                            rd: player.getRd(),
                            vol: player.getVol()
                        };
                        var oppObj = {
                            username: obj.username,
                            rating: Math.floor(opp.getRating()),
                            rd: opp.getRd(),
                            vol: opp.getVol()
                        };
                        socket.emit("new-ratings", myObj, oppObj);
                        db.close();
                    });
                });
            });
        });

        socket.on("db-rating", (myRating) => {
            client.connect(url, (err, db) => {
                if (err) throw err;
                var dbo = db.db("point-chess");
                var filter = {username: myRating.username};

                dbo.collection("ratings").updateOne(filter, {$set : myRating}, (err, result) => {
                    if (err) throw err;
                    db.close();
                });
            });
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
                        games[roomLeft].isOver = true;
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