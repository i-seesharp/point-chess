var socket = io();
var board;

var onDrop = (source, target, piece, newPos, oldPos, orn) => {
    socket.emit("move", {from: source, to: target}, oldPos, piece);
}
var onDragStart = (source, piece, position, orn) => {
    return (piece[0] == orn[0]);
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

