const tokenUtil = require("../util/token");
require('dotenv').config();
const LINK = require("../util/links.json");
const authUtil = require("../util/auth");

module.exports={
    //Authorization middleware 
    authorize:async function (req, res, next) {
        let token = req.header('Authorization');
        let req_url = req.originalUrl;

        console.log(req.method+" - "+req_url);

        //không có Token có thể vào các đường dẫn
        if(!token && (
                //login local
                    req_url.includes(LINK.CLIENT.AUTHENTICATION_LOGIN) 
                ||  req_url.includes(LINK.CLIENT.AUTHENTICATION_CREATE_ACCESSTOKEN)
                ||  req_url.includes(LINK.CLIENT.AUTHENTICATION_CREATE_PASSWORD_HASH) 
        ) ){
            next();
            return ;
        }

        if (!token) return res.status(401).send("Unauthorized");

        try {
            if (token.startsWith('Bearer ')) {
                // Remove Bearer from string
                token = token.slice(7, token.length).trimLeft();
            }
            const verified = tokenUtil.verifyToken(token, process.env.TOKEN_SECRET_ACCESSTOKEN); 

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

            if(verified.status == 0){
                return res.status(403).send("The account does not exist on the system.");
            }
            
            if(verified.status == 2){
                return res.status(403).send("The account has been blocked.");
            }

            //check permission for viewer
            if( verified.role_type === 'viewer' ){ 
                //nếu là viewer chỉ được phép xem 
                if(req.method !== "GET"){
                    return res.status(403).send("Access Denied");
                }
            }

            //check permission for links of root
            if(
                    req_url.includes(LINK.ADMIN.LIMIT_FANPAGE_GET_ALL) 
                ||  req_url.includes(LINK.ADMIN.LIMIT_FANPAGE_ADD_NEW)
                ||  req_url.includes(LINK.ADMIN.LIMIT_FANPAGE_UPDATE_BY_ID)
                ||  req_url.includes(LINK.ADMIN.LIMIT_FANPAGE_DELETE_BY_ID)
                ||  req_url.includes(LINK.ADMIN.FB_APP_SUBSCRIPTIONS_GET)
                ||  req_url.includes(LINK.ADMIN.FB_APP_SUBSCRIPTIONS_SET)
                ||  req_url.includes(LINK.ADMIN.FB_APP_SUBSCRIPTIONS_DELETE)
            ){
                if( verified.role_type !== 'root' ){ 
                    //không được vào trang cua root  
                    return res.status(403).send("Access Denied");
                }
             
            }
            
            //check permission of user when request to admin router
            if(req_url.includes("/admin/")){
                if( verified.role_type !== 'root' &&  verified.role_type !== 'admin' ){ 
                    //không được vào trang admin 
                    return res.status(403).send("Access Denied");
                }
            }
            
            req.user = verified;
            next();
        }
        catch (err) {
            //token verify fail
            if(
                req_url.includes(LINK.CLIENT.AUTHENTICATION_LOGIN)
            ||  req_url.includes(LINK.CLIENT.AUTHENTICATION_CREATE_ACCESSTOKEN)
            ||  req_url.includes(LINK.CLIENT.AUTHENTICATION_CREATE_PASSWORD_HASH)
            ){
                next();
            }else{

                return res.status(400).json({
                    code    :41,
                    message :err
                });
            }
        }
    }
}
