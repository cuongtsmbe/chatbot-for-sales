const LINK = require("../util/links.json");
const graphFacebook = require("../util/graphFacebook");
const config = require("../config/default.json");
require('dotenv').config();

const FB_APP_ID = process.env.FB_APP_ID;
const VERIFY_TOKEN_FACEBOOK = process.env.VERIFY_TOKEN_FACEBOOK;


module.exports = {
    facebookAppSubscriptions:function(app){
        app.get(        LINK.ADMIN.FB_APP_SUBSCRIPTIONS_GET                         ,this.getFacebookSubscriptions);
        app.post(       LINK.ADMIN.FB_APP_SUBSCRIPTIONS_SET                         ,this.setFacebookSubscription);
        app.delete(     LINK.ADMIN.FB_APP_SUBSCRIPTIONS_DELETE                      ,this.deleteFacebookSubscription);
    },

    //Đọc các trường(fields,callback_url,object,..) đẵ đăng kí webhooks cho app trong facebook 
    getFacebookSubscriptions:async function(req,res,next){
        try{
            var appAccessToken = await graphFacebook.getAppAccessToken();
            if(!appAccessToken){
                return res.status(500).send("server error. ");
            }

            const response = await axios.get(`${config.fb.graphUrl}/${config.fb.api_version}/${FB_APP_ID}/subscriptions`, {
                params: {
                    access_token : appAccessToken
                }
            });

            let result = response.data;

            return res.status(200).json({
                code:20,
                data:result
            })

        }catch(e){
            console.log(e);
            return res.status(500).send("server error. ");
        }
    },

    //add/update . Thao tác này sẽ sửa đổi gói đăng ký cho chủ đề cụ thể mà không ghi đè các trường hiện có.
    //các trường được set mặc định
    setFacebookSubscription:async function(req,res,next){
        try{
            var appAccessToken = await graphFacebook.getAppAccessToken();
            
            if(!appAccessToken){
                return res.status(500).send("server error. ");
            }

            const options = {
                url: `${config.fb.graphUrl}/${config.fb.api_version}/${FB_APP_ID}/subscriptions`,
                method: 'POST',
                params: {
                    object: config.fb.object,
                    callback_url: config.fb.webhooksCallBackUrl,
                    fields: config.fb.fieldsObject.join(","),
                    verify_token: VERIFY_TOKEN_FACEBOOK,
                    access_token: appAccessToken,
                    include_values: true
                },
            };
        
            let response = await axios(options);

            const result = response.data;

            try{

                if(result.success == true){
                    return res.status(200).json({
                        code:20,
                        message: "set fields for subsciption app success."
                    })
                }

            }catch(e){
                return res.status(400).json({
                    code:40,
                    message: "set fields for subsciption app fail.",
                    error: result
                })

            }


        }catch(e){
            console.log(e);
            return res.status(500).send("server error. ");
        }
    },

    //xóa tất cả gói đăng ký(fields) của object(page)
    deleteFacebookSubscription:async function(req,res,next){
        try{
            var appAccessToken = await graphFacebook.getAppAccessToken();
            
            if(!appAccessToken){
                return res.status(500).send("server error. ");
            }

            const options = {
                url: `${config.fb.graphUrl}/${config.fb.api_version}/${FB_APP_ID}/subscriptions`,
                method: 'DELETE',
                params: {
                    object: config.fb.object,
                    access_token: appAccessToken
                },
            };
        
            let response = await axios(options);

            const result = response.data;

            try{

                if(result.success == true){
                    return res.status(200).json({
                        code:20,
                        message: "delete all fields had subsciption in app success."
                    })
                }

            }catch(e){
                return res.status(400).json({
                    code:40,
                    message: "delete all fields had subsciption in app fail.",
                    error: result
                })

            }

        }catch(e){
            console.log(e);
            return res.status(500).send("server error. ");
        }
    },

}



/**
 * 
 * tài liệu : 
 * https://developers.facebook.com/docs/graph-api/reference/v16.0/app/subscriptions
 *  
 * 
 **/