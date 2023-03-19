const fanpageModel = require("../models/fanpage.model");
const buyerModel = require("../models/buyer.model");
const orderModel = require("../models/order.model");
const conversationModel = require("../models/conversation.model");
const { v4: uuidv4 } = require("uuid"); 
const openaiUtil  = require("./openai");

module.exports = {
    //handle Messenger text or file
    handleMessage:async function(sender_psid, WebEvents) {
        let response;
        
        let checkFanpage = await fanpageModel.getOne({fanpage_id:sender_psid}); 

        if(checkFanpage.length > 0 && checkFanpage[0].active === true && checkFanpage[0].status === 1 ){
            //chặn(yêu cầu đến openAI) khi AI trong fanpage gửi qua buyer
            return true;
        }

        //người quản trị fanpage gửi qua buyer (khi fanpage đã tắt AI)
        if(checkFanpage.length > 0){
            let createdDate = new Date(); // Lấy thời gian hiện tại cho created_date
            let createdDatetime = createdDate.toISOString().slice(0, 19).replace('T', ' ');
            //add to coversation when AIresponse
            conversationModel.add({
                conversation_id :uuidv4(),
                fanpage_id      :sender_psid,
                sender_psid     :WebEvents.recipient.id,
                message         :WebEvents.message.text,
                type            :"Seller",
                create_date     :createdDatetime
            });

            return true;
        }

        let buyer_facebook_id = sender_psid;
        let fanpage_id = WebEvents.recipient.id;

        // Định dạng chuỗi datetime cho MySQL
        // Cắt để loại bỏ phần giây thừa và thay thế ký tự "T" bằng dấu cách để đáp ứng định dạng datetime của MySQL
        let createdDate = new Date(); // Lấy thời gian hiện tại cho created_date
        let createdDatetime = createdDate.toISOString().slice(0, 19).replace('T', ' ');

        //add to coversation(user -> fanpage)
        conversationModel.add({
            conversation_id :uuidv4(),
            fanpage_id      :fanpage_id,
            sender_psid     :buyer_facebook_id,
            message         :WebEvents.message.text,
            type            :"Buyer",
            create_date     :createdDatetime
        });

        //get details buyer by fanpage id and facebook sender_psid
        let BuyerDetails = await buyerModel.getOneByFanpageIDAndFacebookIDOfBuyer({
            facebook_id :buyer_facebook_id,
            fanpage_id  :fanpage_id
        });
        
        //get fanpage 
        let FanpageDetails = await fanpageModel.getOne({fanpage_id:fanpage_id});

        //check fanpage exist in DB 
        if(FanpageDetails === null || FanpageDetails.length === 0){
            console.log("Fanpage id khong duoc tim thay trong DB.");
            return false;
        }else{
            FanpageDetails=FanpageDetails[0];
        } 

        //blocked/removed fanpage
        if(FanpageDetails.status!==1){
            return false;
        }
        
        //AI turn off in fanpage or buyer
        if(FanpageDetails.active === false || (BuyerDetails.length!=0 && BuyerDetails[0].active === false ) ){
            return false;
        }

        // Checks if the message contains text
        if (WebEvents.message.text) {  
            // Create the payload for a AI response text message, which
            // will be added to the body of our request to the Send API

            //thêm "donhang" vào DB. để phòng trg hợp khách hàng ghi sai/không ghi : "LENDON" || lendon
            if(WebEvents.message.text.includes("LENDON")||WebEvents.message.text.includes("lendon")||WebEvents.message.text.includes("donhang")){
                
                let modifiedDate = new Date(); // Lấy thời gian hiện tại cho modified_date
                let modifiedDatetime = modifiedDate.toISOString().slice(0, 19).replace('T', ' ');

                var value={
                    order_id            : uuidv4(),           
                    fanpage_id          : fanpage_id,
                    buyer_id            : buyer_id,
                    content             : WebEvents.message.text,
                    created_date        : createdDatetime,
                    modified_date       : modifiedDatetime,
                    status              : 1
                };

                //add order in DB
                await orderModel.add(value);
            }

            //AI reply
            //BuyerDetails is array 
            let AIresponse=await openaiUtil.GetAIReplyForBuyer(buyer_facebook_id,BuyerDetails,FanpageDetails,WebEvents.message.text);
            
            //add coversation after AI response
            createdDate = new Date();
            createdDatetime = createdDate.toISOString().slice(0, 19).replace('T', ' ');

            //add to coversation when AIresponse
            conversationModel.add({
                conversation_id :uuidv4(),
                fanpage_id      :fanpage_id,
                sender_psid     :buyer_facebook_id,
                message         :AIresponse,
                type            :"Seller",
                create_date     :createdDatetime
            });

            console.log(`------user id:${sender_psid}---------`);
            console.log("\n\n");
            console.log("--------Chat----------");
            console.log(`user: ${WebEvents.message.text}`);
            console.log(`AI: ${AIresponse}`);
            console.log("--------###-------\n\n");
            console.log("\n");

            response = {
                "text": AIresponse
            }
        } else if (WebEvents.attachments) {
            // Get the URL of the message attachment
            // reponse for image or ..
            let attachment_url = WebEvents.attachments[0].payload.url;
            response = {
                "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                    "title": "Is this the right picture?",
                    "subtitle": "Tôi không hiểu ảnh này của bạn.Làm ơn hãy gửi mã sản phẩm trên ảnh thay vì gửi ảnh cho tôi.",
                    "image_url": attachment_url,
                    }]
                }
                }
            }
        } 
        
        // Send the response message
        this.callSendAPI(sender_psid, response, FanpageDetails.key_fanpage);    
    },

    // Sends response messages via the Send API
    // response from page to sender_id
    callSendAPI: function(sender_psid, response ,PAGE_ACCESS_TOKEN) {
        // Construct the message body
        let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
        }

        // Send the HTTP request to the Messenger Platform
        request({
            "uri": "https://graph.facebook.com/v2.6/me/messages",
            "qs": { "access_token": PAGE_ACCESS_TOKEN },
            "method": "POST",
            "json": request_body
        }, (err, res, body) => {
        if (!err) {
            console.log('message sent!',request_body);
            
        } else {
            console.error("Unable to send message:" + err);
        }
        }); 
    }
}