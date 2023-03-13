const express = require("express");
const app = express();
require('dotenv').config();
const port = process.env.PORT || 80;
const bodyParser = require('body-parser');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())


app.get("/about",function(req,res){
 res.send("13/3/2023 .Setup chatbot");
});

app.listen(port, () => {
 console.log(` listening on port ${port}!`);
});
