const userModel = require("../models/user.model");
const crypto=require('crypto');
const LINK = require("../util/links.json");
const str2ab = require('string-to-arraybuffer');
const tokenUtil = require("../util/token");
require('dotenv').config();


module.exports = {
    authRouters:function(app){
        app.post(    LINK.CLIENT.AUTHENTICATION_LOGIN                     ,this.loginLocal);
       
    },

    //LOGIN LOCAL
    loginLocal:async function(req,res,next){
        var value={
            user_name:req.body.user_name.trim(),
            password:req.body.password 
        };
        try{
            //kiem tra username có tồn tại chưa
            var user=await userModel.getOne({user_name:value.user_name});

            if(0 == user.length){
                return res.status(400).json({
                    code:40,
                    message:"Incorrect username or password."
                });   
            }

        }catch(e){
            console.log(e);
            return res.status(500).send("server error ");
        }

        user=user[0];

        //kiểm tra password(chua hash) với password của user trên DB 
        crypto.pbkdf2(value.password,process.env.SALT_PASSWORD, 310000,32, 'sha256',async function(err, hashedPassword) {
            if (err) {
                res.status(500).json({
                    code:50,
                    message:"Server error."
                });            
                return false;
            }
            //cover to String hex 
            try{
                hashedPassword=hashedPassword.toString("hex");
                //check user password in DB and value.password had hash
                if (!crypto.timingSafeEqual(str2ab(String(user.password)),str2ab(String(hashedPassword)))) {
                    return res.status(400).json({
                        code:40,
                        message:"Incorrect username or password."
                    });   
                }
                //Create and assign token
                return res.status(200).json(await tokenUtil.GetAccessTokenAndRefreshTokenOfUser(user));
                
            }catch(err){
                console.log(err);
                return res.status(500).json({
                    code:50,
                    message:"Account don't register for login local"
                })
            }      
        });
    },
}