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

module.exports = {
    get_position: get_piece_positions
}