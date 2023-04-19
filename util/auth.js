const {redis}   = require("./redis");

module.exports={
    compareTokenWithRedis:async function(verified){
        try{
            let userInRedis = await redis.get(`user_id_${verified.user_id}`);
        
            if(userInRedis!=null){
                userInRedis = JSON.parse(userInRedis);
                if(userInRedis.status != verified.status || userInRedis.role_type != verified.role_type){
                    // status và role_type đã bị thay đổi trong DB
                    return false;
                }
                return true;
            }
        }catch(e){
            console.log(e);
            return "Error in checkTokenWithRedis function in file auth mdw.";
        }
        return false;
    }
}