var socket = io();
var board = null;
var fromSquare = null;
var toSquare = null;

var onDrop = (source, target, piece, newPos, oldPos, orn) => {
    socket.emit("move", {from: source, to: target}, Chessboard.objToFen(oldPos), piece);
}
var onDragStart = (source, piece, position, orn) => {
    return (piece[0] == orn[0]);
}

socket.on("change", (newPos, oldPos, moveObj, checkObj) => {
    board.position(newPos);
    var factorX = Chessboard.objToFen(Chessboard.fenToObj(newPos));
    var factorY = Chessboard.objToFen(Chessboard.fenToObj(oldPos));
    if (factorX !== factorY){
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
            fromSquare.style.background = "rgb(252,255,205,0.45)";
            toSquare.style.background = "rgb(252,255,205,0.7)";
        }
        if(checkObj.inCheck){
            kingSquare = document.querySelector("#board .square-"+checkObj.kingSquare);
            kingSquare.style.background = "rgb(255,0,0,0.4)";
        }
        else{
            kingSquare = document.querySelector("#board .square-"+checkObj.kingSquare);
            kingSquare.style.background = "";
        }
    }

});
socket.on("play", (room, id) => {
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
    }
    else{
        config.orientation = "black";
    }
    board = Chessboard("board", config);
});

