var socket = io();
var board;

var onDrop = (source, target, piece, newPos, oldPos, orn) => {
    socket.emit("move", Chessboard.objToFen(newPos));
}

socket.on("change", (newPos) => {
    board.position(newPos);
});
socket.on("play", (room, id) => {
    console.log("In room ", room);
    let config = {
        position: "start",
        draggable: true,
        dropOffBoard: "snapback",
        onDrop: onDrop
    }
    if(id === socket.id){
        config.orientation = "white";
    }
    else{
        config.orientation = "black";
    }
    board = Chessboard("board", config);
});

