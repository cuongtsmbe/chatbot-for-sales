const jwt = require("jsonwebtoken");
require('dotenv').config();

module.exports={
    //get accesstoken and refreshtoken for user
    GetAccessTokenAndRefreshTokenOfUser:async function(user){
        var payload={
                user_id             :user.user_id,
                user_name           :user.user_name,
                role_type           :user.role_type,
                status              :user.status,
                iat                 :Math.floor(Date.now() / 1000),
        };

        //create AccessToken AND refreshToken
        const AccessToken = jwt.sign(payload, process.env.TOKEN_SECRET_ACCESSTOKEN,{ expiresIn: "1d"});
        const refreshToken = jwt.sign(payload, process.env.TOKEN_SECRET_REFRESHTOKEN,{ expiresIn:"30d" });

        //reponse
        return {
            code:20,
            message:"Login success.",
            user:{
                user_id         :user.user_id,
                user_name       :user.user_name,
                AccessToken     :AccessToken,
                refreshToken    :refreshToken
            }

        };  
    },

    //get accesstoken 
    GetAccessToken:async function(user){
        var payload={
                user_id             :user.user_id,
                user_name           :user.user_name,
                role_type           :user.role_type,
                status              :user.status,
                iat                 :Math.floor(Date.now() / 1000),
        };

        //create AccessToken 
        const AccessToken = jwt.sign(payload, process.env.TOKEN_SECRET_ACCESSTOKEN,{ expiresIn: "1d"});
       
        //reponse
        return {
                code:20,
                message:"get accesstoken success.",
                user:{
                    user_id         :user.user_id,
                    user_name       :user.user_name,
                    AccessToken     :AccessToken,
                }
        };  
    },

    //verify accesstoken/refreshtoken 
    verifyToken:async function(token,key){
        return jwt.verify(token,key);  
    }
}
  