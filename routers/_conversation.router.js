const conversationModel = require("../models/conversation.model");
const fanpageModel = require("../models/fanpage.model");
const LINK = require("../util/links.json");
const config    =require("../config/default.json");

module.exports = {
    conversationRouters:function(app){
        app.get(    LINK.CLIENT.CONVERSATION_GET_BY_FANPAGE_AND_SENDER_ID         ,this.getByFanpageAndSenderID);
    },

    //get conversation of fanpage and sender id
    getByFanpageAndSenderID:async function(req,res,next){
        //set default page
        if(isNaN(req.query.page) || req.query.page<=0){
            req.query.page=1;
        }

        var condition={
            fanpage_id  :req.params.fanpage_id,
            sender_id   :req.params.sender_id,
            limit       :config.limitConversation,
            offset      :config.limitConversation*(req.query.page-1),
        };


        try{
            // check fanpage id exist in DB
            var fanpageResult=await fanpageModel.getOne({fanpage_id:condition.fanpage_id});

            if(fanpageResult.length == 0){
                    return res.status(400).json({
                        code:40,
                        message:`fanpage ${condition.fanpage_id} not exist`
                    });
            }

            //get conversations
            var conversationResults=await conversationModel.getConversationsByFanpageAndSenderID(condition);

        }catch(e){
            console.log(e);
            return res.status(500).send("server error ");
        }

        return res.status(200).json({
            code:20,
            data:conversationResults,
            PageCurrent:req.query.page, 
        })
    },

}