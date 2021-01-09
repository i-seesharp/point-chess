const client = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017/";

var storeGame = (gamePgn, username, color) => {
    client.connect(url, (err, db) => {
        if (err) throw err;
        var dbo = db.db("point-chess");
        var obj = {
            username: username,
            pgn: gamePgn,
            color: color
        }
        dbo.collection("games").insertOne(obj, (err, result) => {
            if (err) throw err;
            console.log("Game Inserted");
            db.close();
        });
    });
}

module.exports = storeGame;