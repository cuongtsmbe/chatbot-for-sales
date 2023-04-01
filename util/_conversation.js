const config    = require("../config/default.json");

module.exports={
    getCurrentMessage: async (fanpage,user_psid) => {
        const graphApiVersionUrl  = `https://graph.facebook.com/${config.api_version_facebook}`;
        // Tìm cuộc trò chuyện với một người dùng cụ thể
        var conversationsResponse = await axios.get(
            `${graphApiVersionUrl}/${fanpage.fanpage_id}/conversations`, 
            {
                params: {
                    access_token    : fanpage.key_fanpage,
                    platform        : config.platform,
                    user_id         : user_psid
                }
            }
        );

        // Lấy ID của cuộc trò chuyện
        var conversationId = conversationsResponse.data.data[0].id;

        // Lấy tất cả các tin nhắn của cuộc trò chuyện này
        var response = await axios.get(
            `${graphApiVersionUrl}/${conversationId}/messages`, 
            {
                params: {
                    access_token: fanpage.key_fanpage,
                    fields: 'id,created_time,from,to,message'
                }
            }
        );
        
        let urlGraph;

        if (response.data.paging) {
            if(response.data.paging.next){
                urlGraph = response.data.paging.next.split('?')[0];    
            } 
            //delete next url
            if(response.data.paging.next){
                delete response.data.paging.next;
            }
            //add urlGraph to response
            response.data.paging = {...response.data.paging,urlGraph};
        }

        return response.data;
    },


    //get message by cursor previous or after key in GraphQL API FACEBOOK
    getMessageWithCursor:async function(fanpage,url,type,keyCursor){
        const existingParams={
            access_token    : fanpage.key_fanpage,
            fields          : 'id,created_time,from,to,message',
            limit           : 25
        }
        var newParams;

        if(type == "after"){
            newParams = { ...existingParams, after: keyCursor };
        }

        if(type == "before"){
            newParams = { ...existingParams, before: keyCursor };
        }
            
        const response = await axios.get(url, { params });

        let urlGraph; //example https://graph.facebook.com/v16.0/t_1557011504781172/messages

        if (response.data.paging) {
            if(response.data.paging.previous){
                urlGraph = response.data.paging.previous.split('?')[0];    
            }else{
                urlGraph = response.data.paging.next.split('?')[0];    
            } 
            
            //delete previous and next in paging
            if(response.data.paging.previous){
                delete response.data.paging.previous;
            }
            if(response.data.paging.next){
                delete response.data.paging.next;
            }
            //add urlGraph to response
            response.data.paging = {...response.data.paging,urlGraph};
        }

        return response.data;
    }
    
}