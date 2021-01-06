var socket = io();
var board = null;
var fromSquare = null;
var toSquare = null;
var currRed = [];


var onDrop = (source, target, piece, newPos, oldPos, orn) => {
    socket.emit("move", {from: source, to: target}, Chessboard.objToFen(oldPos), piece);
}
var onDragStart = (source, piece, position, orn) => {
    return (piece[0] == orn[0]);
}

socket.on("connect", () => {
    socket.emit("my-name", document.getElementById("my_name").innerHTML);
});
socket.on("change", (newPos, oldPos, moveObj, checkObj) => {
    board.position(newPos);
    var factorX = Chessboard.objToFen(Chessboard.fenToObj(newPos));
    var factorY = Chessboard.objToFen(Chessboard.fenToObj(oldPos));
    if (factorX !== factorY){
        var drawItems = document.querySelectorAll(".draw_offer");
        for(var i =0; i < drawItems.length; i++){
            drawItems[i].style.visibility = "hidden";
        }
        console.log(newPos);
        console.log(oldPos);
        
        if (fromSquare !== null){
            fromSquare.style.background = "";
        }
        if (toSquare !== null){
            toSquare.style.background = "";
        }
        fromSquare = document.querySelector("#board .square-"+ moveObj.from);
        toSquare = document.querySelector("#board .square-"+ moveObj.to);
        if(fromSquare.getAttribute("id") !== toSquare.getAttribute("id")){
            fromSquare.style.background = "rgba(253, 247, 141, 0.45)";
            toSquare.style.background = "rgba(253, 247, 141, 0.75)";
        }
        if(checkObj.inCheck){
            kingSquare = document.querySelector("#board .square-"+checkObj.kingSquare);
            kingSquare.style.background = "rgba(255,0,0,1.0)";
            currRed.push(kingSquare);
        }
        else{
            for(var i=0; i < currRed.length; i++){
                currRed[i].style.background = "";
            }
            currRed = [];
        }
    }

});
socket.on("play", (room, id, whiteName, blackName) => {
    console.log("In room ", room);
    let config = {
        position: "start",
        draggable: true,
        dropOffBoard: "snapback",
        onDrop: onDrop,
        onDragStart: onDragStart
    }
    if(id === socket.id){
        config.orientation = "white";
        showNames(whiteName, blackName);
    }
    else{
        config.orientation = "black";
        showNames(blackName, whiteName);
    }
    board = Chessboard("board", config);
    showButtons();

    drawBtn = document.getElementById("draw_btn");
    resignBtn = document.getElementById("resign_btn");

    drawBtn.addEventListener("click", () => {
        socket.emit("draw");
    });

    resignBtn.addEventListener("click", () => {
        socket.emit("resign");
    });
});

socket.on("game-over", (reason, winner) => {
    var endMessage = "";
    if(reason == "abandonment"){
        console.log("Opponent Left the Game.");
        endMessage = "<h1>You Win! Your opponent left the game</h1>";
        
    }
    else if(reason == "resignation"){
        if(winner == socket.id){
            console.log("Opponent Resigned.");
            endMessage = "<h1>You Win! Your opponent has resigned! </h1>";
        }else{
            console.log("You resigned.");
            endMessage = "<h1>You Lost! You resigned </h1>";
        }
        
    }
    else{
        console.log("Game Drawn.");
        endMessage = "<h1>Game Drawn! 1/2 - 1/2</h1>";
    }
    board = Chessboard("board", {position: board.fen(), draggable: false, orientation : board.orientation()});
    var messageDiv = document.getElementById("message");
    messageDiv.innerHTML = endMessage;
    
    hideButtons();

});

socket.on("draw-offer", () => {
    var drawItems = document.querySelectorAll(".draw_offer");
    for(var i = 0; i < drawItems.length; i++){
        drawItems[i].style.visibility = "visible";
    }

    var acceptBtn = document.getElementById("accept_draw");
    var rejectBtn = document.getElementById("reject_draw");

    acceptBtn.addEventListener("click", () => {
        var drawItems = document.querySelectorAll(".draw_offer");
        for(var i = 0; i < drawItems.length; i++){
            drawItems[i].style.visibility = "hidden";
        }
        socket.emit("accept-draw");
    });

    rejectBtn.addEventListener("click", () => {
        var drawItems = document.querySelectorAll(".draw_offer");
        for(var i = 0; i < drawItems.length; i++){
            drawItems[i].style.visibility = "hidden";
        }
    });
});

socket.on("checkmate", (winner) => {
    var endMessage = "";
    if(winner != socket.id){
        endMessage = "<h1>Game Over! You Lost</h1>";
    }else{
        endMessage = "<h1>Game Over! You Win</h1>";
    }
    board = Chessboard("board", {position: board.fen(), draggable: false, orientation : board.orientation()});
    var messageDiv = document.getElementById("message");
    messageDiv.innerHTML = endMessage;

    hideButtons();
});

socket.on("draw-over", () => {
    var endMessage = "<h1>Game Drawn! 1/2 - 1/2</h1>";
    board = Chessboard("board", {position: board.fen(), draggable: false, orientation : board.orientation()});
    var messageDiv = document.getElementById("message");
    messageDiv.innerHTML = endMessage;
    hideButtons();
    
});

let hideButtons = () => {
    var drawBtn = document.getElementById("draw_btn");
    var resignBtn = document.getElementById("resign_btn");

    drawBtn.style.visibility = "hidden";
    resignBtn.style.visibility = "hidden";
}

let showButtons = () => {
    var drawBtn = document.getElementById("draw_btn");
    var resignBtn = document.getElementById("resign_btn");

    drawBtn.style.visibility = "visible";
    resignBtn.style.visibility = "visible";
}

let showNames = (me, them) => {
    var myNameElem = document.getElementById("my-name");
    var oppNameElem = document.getElementById("opponent-name");
    myNameElem.innerHTML = me;
    oppNameElem.innerHTML = them;
    myNameElem.style.visibility = "visible";
    oppNameElem.style.visibility = "visible";
}

