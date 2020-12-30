var socket = io();


let onDrop = (source, target, piece, newPos, oldPos, orn) => {
    socket.emit("move", Chessboard.objToFen(newPos));
}

socket.on("change", (newPos) => {
    board.position(newPos);
});

let config = {
    position: "start",
    draggable: true,
    dropOffBoard: "snapback",
    onDrop: onDrop
}
var board = Chessboard("board", config);
