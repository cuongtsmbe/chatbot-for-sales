const userModel = require("../models/user.model");
const LINK = require("../util/links.json");
require('dotenv').config();

module.exports = {
    userRouters:function(app){   
        app.get(    LINK.CLIENT.USER_GET_DETAILS_BY_USER_ID                     ,this.getOneByUserID);
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
    }
}
