
const request   = require("request");
require('dotenv').config();
const config    = require("../config/default.json");

const FB_APP_ID = process.env.FB_APP_ID;
const FB_APP_SECRET = process.env.FB_APP_SECRET;
const graphUrl  = `https://graph.facebook.com`;

module.exports = {

    getAppSecretProof:function(access_token){
        const crypto = require('crypto');
        const app_secret = FB_APP_SECRET;
        
        const hmac = crypto.createHmac('sha256', app_secret);
        hmac.update(access_token);
        const appsecret_proof = hmac.digest('hex');

        console.log(appsecret_proof);
        return appsecret_proof;
    },

    sendRequest :function(options){
        return new Promise((resolve, reject) => {
            request(options, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    const data = JSON.parse(body);
                    resolve(data);
                } else {
                    reject(null);
                }
            });
        });
    },

    //lay thong tin user(first_name,last_name,profile_pic) tu psid facebook and page_access_token (key fanpage)
    getFacebookUserInfo:async function(PAGE_ACCESS_TOKEN,PSID){
        try{
            const options = {
                url: `${graphUrl}/${PSID}?fields=first_name,last_name,profile_pic&access_token=${PAGE_ACCESS_TOKEN}`,
                method: 'GET'
            };
            let data=null;
            data = await this.sendRequest(options);
            return data;
        }catch(e){
            console.log(e);
            return null;
        }
    },

    //get LONG-LIVED-USER-ACCESS-TOKEN
    getLongLiveUserAccessToken:async function(SHORT_LIVE_USER_ACCESS_TOKEN){
        try{
            const options = {
                url: `${graphUrl}/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${SHORT_LIVE_USER_ACCESS_TOKEN}`,
                method: 'GET'
            };
            let data=null;
            data = await this.sendRequest(options);
            return data.access_token;
        }catch(e){
            console.log(e);
            return null;
        }
    },

    //get page accesstoken no expiration time
    getPageAccessTokenLongLive:async function(PAGE_ID,SHORT_LIVE_USER_ACCESS_TOKEN){
        try{
            let userAccessToken = await this.getLongLiveUserAccessToken(SHORT_LIVE_USER_ACCESS_TOKEN);
            if(!userAccessToken){
                let appsecret_proof = this.getAppSecretProof(userAccessToken);
                const options = {
                    url: `${graphUrl}/${PAGE_ID}?fields=access_token&access_token=${userAccessToken}&appsecret_proof=${appsecret_proof}`,
                    method: 'GET'
                };
                let data=null;
                data = await this.sendRequest(options);
                return data.access_token;
            }
        }catch(e){
            console.log(e);
        }
        return null;
    },

    //register event webhooks for fanpage id
    //page_access_token can long or short time
    connectWebhooksWithFanpage:async function(PAGE_ID,SHORT_LIVE_USER_ACCESS_TOKEN,PAGE_ACCESS_TOKEN){
        try{
            if(!PAGE_ACCESS_TOKEN && !SHORT_LIVE_USER_ACCESS_TOKEN){
                return null;
            }

            if(!PAGE_ACCESS_TOKEN){
                PAGE_ACCESS_TOKEN = await this.getPageAccessTokenLongLive(PAGE_ID,SHORT_LIVE_USER_ACCESS_TOKEN);
            }

            if(!PAGE_ACCESS_TOKEN) return null;

            let appsecret_proof = this.getAppSecretProof(PAGE_ACCESS_TOKEN);
            const options = {
                url: `${graphUrl}/${PAGE_ID}/subscribed_apps?subscribed_fields=messages&access_token=${PAGE_ACCESS_TOKEN}&appsecret_proof=${appsecret_proof}`,
                method: 'POST'
            };
            let data=null;
            data = await this.sendRequest(options);

            return data.success==true || data.success === "true" ;

        }catch(e){
            console.log(e);
            return null;
        }

    },
    
    //lấy danh sách Trang được quản lý bởi user , nếu muốn lấy page-access-token (fields=access_token)
    getListFanpagesManagedByUserAccesstoken: async function(USER_ACCESS_TOKEN){
        if(!USER_ACCESS_TOKEN){
            return null;
        }
        
        try{
            let appsecret_proof = this.getAppSecretProof(USER_ACCESS_TOKEN);
            
            const options = {
                url: `${graphUrl}/${config.fb.api_version}/me/accounts?fields=id,name,picture&access_token=${USER_ACCESS_TOKEN}&appsecret_proof=${appsecret_proof}`,
                method: 'GET'
            };
            let data=null;
            
            data = await this.sendRequest(options);
            
            return data;
        }catch(e){
            console.log(e);
            return null;
        }
    },

    

}


/**
 * 
 * get accesstoken  : https://developers.facebook.com/docs/pages/access-tokens
 * register webhooks: https://developers.facebook.com/docs/messenger-platform/webhooks#k-t-n-i--ng-d-ng
 * 
 * **/