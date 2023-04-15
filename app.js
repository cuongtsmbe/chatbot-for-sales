const express = require("express");
const app = express();
require('dotenv').config();
const bodyParser = require('body-parser');
const authMdw   = require("./mdw/_auth.mdw");
const facebookUtil = require("./util/webhooks");
const rabbitMQ = require('./util/rabbitmq');
const config = require('./config/default.json');

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


if(config.rabbitMQ.connection.max<=config.rabbitMQ.consumer.number){
    console.log("**Phải đặt connection.max(rabbitmq) > consumer.number **");
    console.log("*Nguyên nhân vì có thể consumer sẽ có thể giữ hết connection và không release dẫn đến rabbitmq không hoạt động*");
}


//create consumer listen queue in rabbitMQ
for(let i=0;i<config.rabbitMQ.consumer.number;i++){
    rabbitMQ.consumerRabbitMQ(i);
}

app.get("/webhook",facebookUtil.getWebHook);
app.post("/webhook", facebookUtil.postWebHook);
app.get("/about",function(req,res){
    res.send("13/3/2023 .Setup chatZi");
});

app.use(authMdw.authorize);

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

module.exports={
  app
}