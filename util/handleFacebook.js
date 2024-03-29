const fanpageModel = require("../models/fanpage.model");
const buyerModel = require("../models/buyer.model");
const orderModel = require("../models/order.model");
const { v4: uuidv4 } = require("uuid"); 
const openaiUtil  = require("./openai");
const request   = require("request");
const {redis}   = require("./redis");
const socketUtil    = require("./socket");

module.exports = {
    //handle Messenger text or file
    handleMessage:async function(sender_psid, WebEvents) {
        try{
            let checkFanpage=null;
            let response;

            checkFanpage = await redis.get(`fanpage_${sender_psid}`);
          
            if(checkFanpage==null){
                //redis not exist this fanpage 
                checkFanpage = await fanpageModel.getOne({fanpage_id:sender_psid}); 
                if(checkFanpage.length > 0){
                    //set value fanpage to redis if not exist
                    await redis.set(`fanpage_${sender_psid}`, JSON.stringify(checkFanpage));
                }
            }else{
                checkFanpage = JSON.parse(checkFanpage);
            }
            
            //người quản trị or AI fanpage gửi qua buyer 
            if(checkFanpage.length > 0){
                let roomByFanapageID=await socketUtil.getRoomByFanpageID(sender_psid);
                if(!roomByFanapageID){
                    socketUtil.emitMessageFromFanpageSend(roomByFanapageID,String(WebEvents.message.text));
                }
                
                //khi người quản trị gõ "[on]" hoặc "[off]" thì thực hiện update active AI cho buyer
                if(String(WebEvents.message.text).toLowerCase().includes("[on]")||String(WebEvents.message.text).toLowerCase().includes("[off]")){
                    let active_change=false;
                    
                    if(String(WebEvents.message.text).toLowerCase().includes("[on]")){
                        active_change=true;
                    }

                    //get details buyer by fanpage id and facebook sender_psid
                    let BuyerDetails = await redis.get(`buyer_fanpageid_${sender_psid}_fbid_${WebEvents.recipient.id}`) ;
                    
                    if(BuyerDetails==null){
                        //redis not exist 
                        BuyerDetails = await buyerModel.getOneByFanpageIDAndFacebookIDOfBuyer({
                            facebook_id :WebEvents.recipient.id,
                            fanpage_id  :sender_psid
                        });

                        if(BuyerDetails.length > 0){
                            //set value fanpage to redis if not exist
                            await redis.set(`buyer_fanpageid_${sender_psid}_fbid_${WebEvents.recipient.id}`, JSON.stringify(BuyerDetails));
                        }
                    }else{
                        BuyerDetails = JSON.parse(BuyerDetails);
                    }


                    //thực hiện turn on/off nếu buyer có trong hệ thống 
                    if(BuyerDetails.length!=0 && (BuyerDetails[0].active != active_change)){
                    
                        let condition={
                            buyer_id        :BuyerDetails[0].buyer_id
                        }
                
                        let value={     
                            active          : active_change
                        };
                        //update to Db
                        let buyerActiveUpdateResult=await buyerModel.update(condition,value);

                        if(buyerActiveUpdateResult.length!=0 && buyerActiveUpdateResult.affectedRows!=0){
                            //update active in redis
                            BuyerDetails[0].active=active_change;

                            let redisUpdateActiveResult=await redis.set(`buyer_fanpageid_${sender_psid}_fbid_${WebEvents.recipient.id}`, JSON.stringify(BuyerDetails));
                           
                            if(redisUpdateActiveResult!="OK"){
                                console.log(`[REDIS] set active for buyer_fanpageid_${sender_psid}_fbid_${WebEvents.recipient.id} not success.`);
                            }

                        }
                        
                    }

                }
               
                return true;
            }

            if(checkFanpage.length > 0 && checkFanpage[0].active == true && checkFanpage[0].status == 1 ){
                //chặn(yêu cầu đến openAI) khi AI trong fanpage gửi qua buyer
                return true;
            }

            let buyer_facebook_psid = sender_psid;
            let fanpage_id = WebEvents.recipient.id;

            let room=await socketUtil.getRoomByFanpageID(fanpage_id);
                    
            if(!room){
                socketUtil.emitMessageClient(room,WebEvents.message.text);
            }

            // Định dạng chuỗi datetime cho MySQL
            let createdDate = new Date(); 
            let createdDatetime = createdDate.toISOString().slice(0, 19).replace('T', ' ');
     
            //get details buyer by fanpage id and facebook sender_psid
            let BuyerDetails = await redis.get(`buyer_fanpageid_${fanpage_id}_fbid_${buyer_facebook_psid}`) ;
                    
            if(BuyerDetails==null){

                BuyerDetails = await buyerModel.getOneByFanpageIDAndFacebookIDOfBuyer({
                    facebook_id :buyer_facebook_psid,
                    fanpage_id  :fanpage_id
                });

                if(BuyerDetails.length > 0){
                    await redis.set(`buyer_fanpageid_${fanpage_id}_fbid_${buyer_facebook_psid}`, JSON.stringify(BuyerDetails));
                }

            }else{
                BuyerDetails = JSON.parse(BuyerDetails);
            }


            let FanpageDetails = await redis.get(`fanpage_${fanpage_id}`);

            if(FanpageDetails==null){

                FanpageDetails = await fanpageModel.getOne({fanpage_id:fanpage_id});

                if(FanpageDetails.length > 0){
                    await redis.set(`fanpage_${fanpage_id}`, JSON.stringify(FanpageDetails));
                }
                
            }else{
                FanpageDetails = JSON.parse(FanpageDetails);
            }

            //check fanpage exist in DB 
            if(FanpageDetails == null || FanpageDetails.length == 0){
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
            if(FanpageDetails.active == false || (BuyerDetails.length!=0 && BuyerDetails[0].active == false ) ){
                return false;
            }

            if (WebEvents.message.text) {  
                //thêm "donhang" vào DB. để phòng trg hợp khách hàng ghi sai/không ghi : "LENDON" || lendon
                if(WebEvents.message.text.includes("LENDON")||WebEvents.message.text.includes("lendon")||WebEvents.message.text.includes("donhang")){
                    
                    let modifiedDate = new Date(); 
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

                    let room=await socketUtil.getRoomByFanpageID(fanpage_id);

                    if(!room){
                        socketUtil.emitOrder(room,WebEvents.message.text);
                    }
                    
                }

                //AI reply
                //BuyerDetails is array 
                let AIresponse=await openaiUtil.GetAIReplyForBuyer(buyer_facebook_psid,BuyerDetails,FanpageDetails,WebEvents.message.text);
                
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
        }catch(e){
            console.log(e);
        }
    },

    // Sends response messages via the Send API
    callSendAPI: function(sender_psid, response ,PAGE_ACCESS_TOKEN) {
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
    },

}