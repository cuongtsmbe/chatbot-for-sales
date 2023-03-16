const fanpageModel = require("../models/fanpage.model");
const buyerModel = require("../models/buyer.model");
const orderModel = require("../models/order.model");
const { v4: uuidv4 } = require("uuid"); 
const openaiUtil  = require("../util/openai");

module.exports = {
    //handle Messenger text or file
    handleMessage:async function(sender_psid, received_message) {
        let response;
        
        let checkFanpage = await fanpageModel.getOne({fanpage_id:sender_psid}); 
        //chặn hook có sender là fanpage và received là buyer
        if(checkFanpage.length > 0){
            return true;
        }
        let buyer_facebook_id = sender_psid;
        let fanpage_id = received_message.recipient.id;

        //get details buyer by fanpage id and facebook sender_psid
        let BuyerDetails = await buyerModel.getOneByFanpageIDAndFacebookIDOfBuyer({
            facebook_id :buyer_facebook_id,
            fanpage_id  :fanpage_id
        });
        
        //get fanpage 
        let FanpageDetails = await fanpageModel.getOne({fanpage_id:fanpage_id});

        //check fanpage exist in DB 
        if(FanpageDetails === null || FanpageDetails.length == 0){
            console.log("Fanpage id khong duoc tim thay trong DB.");
            return false;
        }else{
            FanpageDetails=FanpageDetails[0];
        } 

        //blocked/removed fanpage
        if(FanpageDetails.status!=1){
            return false;
        }
        
        //AI turn off in fanpage or buyer
        if(FanpageDetails.active === false || (BuyerDetails.length!=0 && BuyerDetails[0].active === false ) ){
            return false;
        }

        // Checks if the message contains text
        if (received_message.text) {  
            // Create the payload for a AI response text message, which
            // will be added to the body of our request to the Send API
            
            //thêm "donhang" vào DB. để phòng trg hợp khách hàng ghi sai/không ghi : "LENDON" || lendon
            if(received_message.text.includes("LENDON")||received_message.text.includes("lendon")||received_message.text.includes("donhang")){
                var value={
                    order_id            : uuidv4(),           
                    fanpage_id          : fanpage_id,
                    buyer_id            : buyer_id,
                    content             : received_message.text,
                    created_date        : "sửa lại",
                    modified_date       : "sửa lại",
                    status              : 1
                };
                //add order in DB
                await orderModel.add(value);
            }

            let AIreponse=await openaiUtil.GetAIReplyForBuyer(BuyerDetails,received_message.text);
            
            console.log(`------user id:${sender_psid}---------`);
            console.log("\n\n");
            console.log("--------Chat----------");
            console.log(`user: ${received_message.text}`);
            console.log(`AI: ${AIreponse}`);
            console.log("--------###-------\n\n");
            console.log("\n");

            response = {
                "text": AIreponse
            }
        } else if (received_message.attachments) {
            // Get the URL of the message attachment
            // reponse for image or ..
            let attachment_url = received_message.attachments[0].payload.url;
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