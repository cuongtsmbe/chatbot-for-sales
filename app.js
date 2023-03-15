const express = require("express");
const app = express();
require('dotenv').config();
const port = process.env.PORT || 80;
const bodyParser = require('body-parser');
const authMdw   = require("./mdw/_auth.mdw");

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())


//Authorization middleware
authMdw.authorize();

//CLIENT
require("./routers/_authentication.router").authRouters(app);
require("./routers/_buyer.router").buyerRouters(app);
require("./routers/_conversation.router").conversationRouters(app);
require("./routers/_fanpage.router").fanpageRouters(app);
require("./routers/_order.router").orderRouters(app);
require("./routers/_prompt.router").promptRouters(app);
require("./routers/_user.router").userRouters(app);
//ADMIN
require("./routers/user.router").userRouters(app);
require("./routers/fanpage.router").fanpageRouters(app);
require("./routers/limit_fanpage.router").limitFanpageRouters(app);

app.get("/about",function(req,res){
 res.send("13/3/2023 .Setup chatbot");
});

app.listen(port, () => {
 console.log(` listening on port ${port}!`);
});
