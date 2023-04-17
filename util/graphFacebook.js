
const axios     = require("axios");
require('dotenv').config();
const config    = require("../config/default.json");

const FB_APP_ID = process.env.FB_APP_ID;
const FB_APP_SECRET = process.env.FB_APP_SECRET;
const graphUrl  = config.fb.graphUrl;

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

    //lay thong tin user(first_name,last_name,profile_pic) tu psid facebook and page_access_token (key fanpage)
    getFacebookUserInfo:async function (PAGE_ACCESS_TOKEN, PSID) {
        try {
            const response = await axios.get(`${graphUrl}/${PSID}`, {
                params: {
                    fields: 'first_name,last_name,profile_pic',
                    access_token: PAGE_ACCESS_TOKEN
                }
            });
            return response.data;
        } catch (error) {
            console.log(error);
            return null;
        }
    },

    getLongLiveUserAccessToken: async function(SHORT_LIVE_USER_ACCESS_TOKEN){
        try{
            const response = await axios.get(`${graphUrl}/oauth/access_token`, {
                params: {
                    grant_type: 'fb_exchange_token',
                    client_id: FB_APP_ID,
                    client_secret: FB_APP_SECRET,
                    fb_exchange_token: SHORT_LIVE_USER_ACCESS_TOKEN
                }
            });
            return response.data.access_token;
        } catch (error) {
            console.log(error);
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
                    url: `${graphUrl}/${PAGE_ID}`,
                    method: 'GET',
                    params: {
                        fields: 'access_token',
                        access_token: userAccessToken,
                        appsecret_proof: appsecret_proof
                    }
                };
                let response = await axios(options);

                return response.data.access_token;
            }
        }catch(e){
            console.log(e);
        }
        return null;
    },

    //đăng ký webhooks cho một trang Facebook.
    //page_access_token can long or short time
    subscribeToPageWebhooks:async function(PAGE_ID,SHORT_LIVE_USER_ACCESS_TOKEN,PAGE_ACCESS_TOKEN){
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
                url: `${graphUrl}/${PAGE_ID}/subscribed_apps`,
                method: 'POST',
                params: {
                    subscribed_fields: config.fb.messageFields.join(","),
                    access_token: PAGE_ACCESS_TOKEN,
                    appsecret_proof: appsecret_proof,
                },
            };
    
            let response = await axios(options);
            let data = response.data;

            return (data.success == true || data.success === "true") ? PAGE_ACCESS_TOKEN : false;

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
            let response = await axios.get(`${graphUrl}/${config.fb.api_version}/me/accounts`, {
                params: {
                    fields: 'id,name,picture',
                    access_token: USER_ACCESS_TOKEN,
                    appsecret_proof: appsecret_proof,
                },
              });
            
            return response.data;
        }catch(e){
            console.log(e);
            return null;
        }
    },


    getAppAccessToken: async function(){
        try {

            const response = await axios.get(`${graphUrl}/oauth/access_token`, {
                params: {
                    client_id: FB_APP_ID,
                    client_secret: FB_APP_SECRET,
                    grant_type: 'client_credentials',
                },
            });

            const accessToken = response.data.access_token;

            return accessToken;

        } catch (error) {
            console.error('Failed to get access token', error);
            return null;
        }
    },


    //hủy đăng ký các webhooks của ứng dụng với một trang Facebook sử dụng app_access_token 
    unsubscribeFromPageWebhooks: async function(PAGE_ID) {
        try {
            let APP_ACCESS_TOKEN = await this.getAppAccessToken();

            if(!APP_ACCESS_TOKEN) return null;

            const options = {
                url: `${graphUrl}/${config.fb.api_version}/${PAGE_ID}/subscribed_apps`,
                method: 'DELETE',
                params: {
                    access_token: APP_ACCESS_TOKEN
                }
            };

            let response = await axios(options);
            
            return (response.data.success || response.data.success == "true") ? true : null;
        } catch (error) {
            console.error(error);
            return null;
        }
    }
    

}


/**
 * 
 * get accesstoken  :   https://developers.facebook.com/docs/pages/access-tokens
 * register webhooks:   https://developers.facebook.com/docs/messenger-platform/webhooks#k-t-n-i--ng-d-ng
 *                      https://developers.facebook.com/docs/graph-api/reference/page/subscribed_apps#ki-u-tr--v--2
 * subcribe/unsubcribe: https://developers.facebook.com/docs/graph-api/reference/page/subscribed_apps
 * 
 * **/