const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");

const app = express();
const PORT = process.env.PORT || 3000

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log("Server listening for connections on port", PORT);
})