const fanpageModel = require("../models/fanpage.model");
const LINK = require("../util/links.json");
const conversationUtil = require("../util/_conversation");
const validate  = require("../util/validation"); 

module.exports = {
    conversationRouters:function(app){
        app.get(    LINK.CLIENT.CONVERSATION_GET_MESSAGES         ,this.getMessages);
    },

    getMessages:async function(req,res,next){

        var condition={
                fanpage_id              : req.query.fanpage_id,
                user_psid               : req.query.user_psid,
                TypeCursor              : req.query.TypeCursor,  //TypeCursor is "current","before","after"
                keyCursor               : req.query.keyCursor,   //key of after or before in GraphQL API Facebook
                urlCursor               : req.query.urlCursor    //example:  https://graph.facebook.com/v16.0/t_1557011504781172/messages 
            };

        //validate TypeCursor
        if(validate.validateTypeConversation(condition.TypeCursor) != true){
            return  res.status(400).json({
                code:40,
                message: validate.validateTypeConversation(condition.TypeCursor),
            });
        }

        if(condition.TypeCursor == "current" && (!condition.user_psid || !condition.fanpage_id)){
            return  res.status(400).json({
                code:40,
                message: "fanpage_id,user_psid is required.",
            });
        }

        if(condition.TypeCursor != "current" && (!condition.keyCursor || !condition.urlCursor)){
            return  res.status(400).json({
                code:40,
                message: "keyCursor,urlCursor is required.",
            });
        }
        
        try{
            // check fanpage id exist in DB
            var fanpage=await fanpageModel.getOne({fanpage_id:condition.fanpage_id});

            if(fanpage.length == 0){
                    return res.status(400).json({
                        code:40,
                        message:`fanpage ${condition.fanpage_id} not exist`
                    });
            }

            fanpage=fanpage[0];
            //get conversations

            if(condition.TypeCursor=="current"){
                return await conversationUtil.getCurrentMessage(fanpage,condition.user_psid);
            }
            
            return await conversationUtil.getMessageWithCursor(fanpage,condition.urlCursor,condition.TypeCursor,condition.keyCursor) ;

        
        }catch(e){
            console.log(e);
            return res.status(500).send("server error ");
        }
    },

}