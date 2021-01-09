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
    socket.emit("get-ratings");
});

socket.on("rating", (rating, elementId) => {
    var ratingString = "(" + rating + ")";
    document.getElementById(elementId).innerHTML += ratingString;
})

socket.on("game-over", (reason, winner, loser) => {
    var endMessage = "";
    var myStatus;
    if(reason == "abandonment"){
        console.log("Opponent Left the Game.");
        endMessage = "<h1>You Win! Your opponent left the game</h1>";
        myStatus = 1;
        
    }
    else if(reason == "resignation"){
        if(winner == socket.id){
            console.log("Opponent Resigned.");
            endMessage = "<h1>You Win! Your opponent has resigned! </h1>";
            myStatus = 1;
        }else{
            console.log("You resigned.");
            endMessage = "<h1>You Lost! You resigned </h1>";
            myStatus = 0;
        }
        
    }
    else{
        console.log("Game Drawn.");
        endMessage = "<h1>Game Drawn! 1/2 - 1/2</h1>";
        myStatus = 0.5;
    }
    board = Chessboard("board", {position: board.fen(), draggable: false, orientation : board.orientation()});
    var messageDiv = document.getElementById("message");
    messageDiv.innerHTML = endMessage;
    if (reason != "abandonment"){
        hideButtons(myStatus);
    }else{
        specialAbandonbment(myStatus, winner, loser);
    }
    

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
    var myStatus;
    if(winner != socket.id){
        endMessage = "<h1>Game Over! You Lost</h1>";
        myStatus = 0;
    }else{
        endMessage = "<h1>Game Over! You Win</h1>";
        myStatus = 1;
    }
    board = Chessboard("board", {position: board.fen(), draggable: false, orientation : board.orientation()});
    var messageDiv = document.getElementById("message");
    messageDiv.innerHTML = endMessage;

    hideButtons(myStatus);
});

socket.on("draw-over", () => {
    var endMessage = "<h1>Game Drawn! 1/2 - 1/2</h1>";
    var myStatus = 0.5;
    board = Chessboard("board", {position: board.fen(), draggable: false, orientation : board.orientation()});
    var messageDiv = document.getElementById("message");
    messageDiv.innerHTML = endMessage;
    hideButtons(myStatus);
    
});

socket.on("new-ratings", (myRating, oppRating) => {
    console.log("My New Rating :", Math.floor(myRating.rating));
    console.log("Opponent New Rating :", Math.floor(oppRating.rating));

    var myName = document.getElementById("my-name");
    var oppName = document.getElementById("opponent-name");
    var len = myName.innerHTML.length;
    for(var i = 0; i < len; i++){
        if(myName.innerHTML[len - 1 - i] == "("){
            break;
        }
    }
    myName.innerHTML = myName.innerHTML.slice(0, len - i) + myRating.rating + ")";
    var len = oppName.innerHTML.length;
    for(var i = 0; i < len; i++){
        if(oppName.innerHTML[len - 1 - i] == "("){
            break;
        }
    }
    oppName.innerHTML = oppName.innerHTML.slice(0, len - i) + oppRating.rating + ")";
    socket.emit("db-rating", myRating);
})

let hideButtons = (myStatus) => {
    var drawBtn = document.getElementById("draw_btn");
    var resignBtn = document.getElementById("resign_btn");

    drawBtn.style.visibility = "hidden";
    resignBtn.style.visibility = "hidden";

    socket.emit("update-ratings", myStatus);
}

let specialAbandonbment = (myStatus, winner, loser) => {
    var drawBtn = document.getElementById("draw_btn");
    var resignBtn = document.getElementById("resign_btn");

    drawBtn.style.visibility = "hidden";
    resignBtn.style.visibility = "hidden";

    socket.emit("abandonment-update", myStatus, winner, loser);
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

