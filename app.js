const express = require("express");
const app = express();
require('dotenv').config();
const port = process.env.PORT || 80;
const bodyParser = require('body-parser');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())


//CLIENT
require("./routers/_buyer.router").buyerRouters(app);
require("./routers/_order.router").orderRouters(app);
require("./routers/_conversation.router").conversationRouters(app);
require("./routers/_prompt.router").promptRouters(app);
//ADMIN
require("./routers/user.router").userRouters(app);
require("./routers/fanpage.router").fanpageRouters(app);


app.get("/about",function(req,res){
 res.send("13/3/2023 .Setup chatbot");
});

app.listen(port, () => {
 console.log(` listening on port ${port}!`);
});
