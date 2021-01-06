const glicko2 = require("glicko2");
const client = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017/";
const settings = {
    tau: 0.5,
    rating: 1200,
    rd: 200,
    vol: 0.06
}

const ratings = new glicko2.Glicko2(settings);
var grandmattress = ratings.makePlayer();
console.log(grandmattress);

client.connect(url, (err, db) => {
    if (err) throw err;
    var dbo = db.db("point-chess");
    dbo.collection("ratings").insertOne(grandmattress, (err, res) => {
        if (err) throw err;
        console.log("Done!");
        dbo.collection("ratings").findOne({id : 0}, {projection : {_id : 0}}, (err, player) => {
            if (err) throw err;
            console.log(ratings.makePlayer(player));
        });
        db.close();
    })
});
// module.exports = ratings;
