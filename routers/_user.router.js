const userModel = require("../models/user.model");
const LINK = require("../util/links.json");
const { v4: uuidv4 } = require("uuid");
const crypto=require('crypto');
require('dotenv').config();

module.exports = {
    userRouters:function(app){   
        app.get(    LINK.CLIENT.USER_GET_DETAILS_BY_USER_ID                     ,this.getOneByUserID);
        app.post(   LINK.CLIENT.USER_REGISTER                                   ,this.register)
    },
    //get details user information
     getOneByUserID:async function(req,res,next){
 
        var condition={
            user_id:    req.user.user_id
        };
        
        try{
            var result= await userModel.getOne(condition);

        }catch(e){
            console.log(e);
            return res.status(500).send("server error ");
        }

        return res.status(200).json({
            code:20,
            data:result
        })
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
