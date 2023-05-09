const userModel = require("../models/user.model");
const fanpageModel = require("../models/fanpage.model");
const socketUtil = require("../util/socket");
const crypto=require('crypto');
const LINK = require("../util/links.json");
const str2ab = require('string-to-arraybuffer');
const tokenUtil = require("../util/token");
const { v4: uuidv4 } = require("uuid");
require('dotenv').config();
const authUtil   = require("../util/auth");

module.exports = {
    authRouters:function(app){
        app.post(    LINK.CLIENT.AUTHENTICATION_LOGIN                           ,this.loginLocal);
        app.post(    LINK.CLIENT.AUTHENTICATION_CREATE_ACCESSTOKEN              ,this.createAccessToken);
        app.post(    LINK.CLIENT.AUTHENTICATION_CREATE_PASSWORD_HASH            ,this.createPwHash);
        app.post(    LINK.CLIENT.USER_REGISTER                                  ,this.register);
    },

    //LOGIN LOCAL
    loginLocal:async function(req,res,next){
        var value={
            user_name:req.body.user_name,
            password:req.body.password 
        };

        if(!value.user_name || !value.password){
            return res.status(400).json({
                code    :40,
                message :"user_name or password empty/null/undefined."
            });
        }      
        
        try{
            value.user_name = value.user_name.trim();
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
            return res.status(500).json({
                code:50,
                message:"Server error."
            });;
        }

        user=user[0];
        try{
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

                    try{
                        //save all room (userID) by fanpageid in redis
                        let listFanpages=await fanpageModel.getListFanpageIDByUserID({user_id:user.user_id});
                        for(let i=0; i<listFanpages.length; i++){
                            let room=await socketUtil.getRoomByFanpageID(listFanpages[i]);
                            if(!room){
                                await socketUtil.saveRoomByFanpageID(listFanpages[i],user.user_id);
                            }
                        }

                        try{
                            //save status,role_type user_id in redis
                            await redis.set(`user_id_${user.user_id}`, JSON.stringify({
                                user_id   : user.user_id,
                                role_type : user.role_type,
                                status    : user.status
                            }));
                        }catch(e){
                            console.log(e);
                        }
        

                        //Create and assign token
                        return res.status(200).json(tokenUtil.GetAccessTokenAndRefreshTokenOfUser(user));

                    }catch(e){
                        console.log(e);
                        return res.status(500).json({
                            code    :51,
                            message :"server error."
                        });
                    }
                    
                }catch(err){
                    console.log(err);
                    return res.status(400).json({
                        code:41,
                        message:"Account don't register for login local"
                    })
                }      
            });
        }catch(err){
            console.log(err);
            return res.status(500).json({
                code    :51,
                message :"server error."
            });
        }
    },


    //create accesstoken from refreshtoken
    createAccessToken:async function(req,res,next){
        //kiểm tra  refreshToken
        try{
            var refreshToken=req.body.refreshToken;
        
            if(!refreshToken){
                    return res.status(400).json({
                        code    :40,
                        message :"refreshToken empty/null/undefined."
                    });
            }        

            //verified resfreshToken 
            const verified = tokenUtil.verifyToken(refreshToken, process.env.TOKEN_SECRET_REFRESHTOKEN);  
          
            let resultChecked = await authUtil.compareTokenWithRedis(verified);
            
            if(resultChecked==false){
                return res.status(403).json({
                    code: 43,
                    message: "Please login againt. status or role of account changed in DB."
                });
            }

            //error 
            if(resultChecked!=true && result!=false){
                throw new Error(resultChecked);
            }

            try{
                return res.status(200).json(tokenUtil.GetAccessToken(verified));
            }catch(e){
                return res.status(500).json({
                    code    :51,
                    message :"server error."
                });
            }
       }catch(err){

            return res.status(400).json({
                code    :41,
                message :err
            });

       } 
   },

   //create password hash(for root user)
   createPwHash:function(req,res,next){
        //key is password for router get password of root
        var value={
            key_router     :req.body.key,
            user_id :uuidv4(),
            password:req.body.password 
        };

        if(!value.key_router || !value.password){
            return res.status(400).json({
                code    :40,
                message :"key router or password empty/null/undefined."
            });
        }        
        

        if(process.env.PASS_ROUTER_GET_PASSWORD !== value.key_router){
            return res.status(400).json({
                code : 41,
                message : "password for router fail."
            });  
        }

        try{
            //hash password and response
            crypto.pbkdf2(value.password,process.env.SALT_PASSWORD, 310000,32, 'sha256',async function(err, hashedPassword) {
                if (err) {
                    console.log(err);
                    res.status(500).json({
                        code:50,
                        message:"Server error."
                    });            
                    return false;
                }

                //cover to String hex 
                hashedPassword=hashedPassword.toString("hex");
                return res.status(200).json({
                    code:20,
                    user_id :value.user_id,
                    password:hashedPassword
                });   
            }); 
        }catch(err){
            console.log(err);
            return  res.status(500).json({
                code:50,
                message:"Server error."
            });    
        }
    },
    register:async function(req,res,next){
        var value={
            user_id         :uuidv4(),           
            user_name       :req.body.user_name,             
            phone_number    :req.body.phone_number,           
            address         :req.body.address,         
            role_type       :"customer",         
            email           :req.body.email,        
            password        :req.body.password,
            status          :1          
        };

        if(!value.user_name || !value.phone_number || !value.address || !value.email || !value.password){
            return res.status(400).json({
                code:40,
                message:"user_name,phone_number,address,email,password is required ."
            });
        }

        try{
            //check user name had exist in DB
            var data = await userModel.getOne({user_name:value.user_name});

            if(data.length>0){
                return res.status(400).json({
                    code:41,
                    message:`Register failed. ${value.user_name} had exist in DB.`
                });
            }

            //hash password and response
            crypto.pbkdf2(value.password,process.env.SALT_PASSWORD, 310000,32, 'sha256',async function(err, hashedPassword) {
                if (err) {
                    console.log(err);
                    res.status(500).json({
                        code:50,
                        message:"Server error."
                    });            
                    return false;
                }

                //cover to String hex 
                hashedPassword=hashedPassword.toString("hex");

                //save password hash
                value.password = hashedPassword;

                //insert to Db
                var result=await userModel.add(value);

                if(result.length==0 || result.affectedRows==0){
                    return res.status(400).json({
                            code:42,
                            message:"Register Fail."
                        })
                }
                return  res.status(200).json({
                            status:20,
                            message:"Register success."
                        })
            }); 

        }catch(e){
            console.log(e);
            return res.status(500).json({
                    code:50,
                    message:"server error."
                });
        }
    }

}