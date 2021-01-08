const glicko2 = require("glicko2");
const client = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017/";
const settings = {
    tau: 0.5,
    rating: 1500,
    rd: 300,
    vol: 0.06
}

const ratings = new glicko2.Glicko2(settings);

module.exports = ratings;
