const {Configuration, OpenAIApi} = require("openai");
require('dotenv').config();
const promptModel = require("../models/prompt.model");
const rabbitMQ  = require("./rabbitmq");
const {redis}   = require("./redis");

module.exports={

    generateCompletion: async function(messages,FanpageDetails,temperature=0.7,max_tokens) {
        try{
            let configuration = new Configuration({
                apiKey: FanpageDetails.key_open_ai,
            });
            let openai = new OpenAIApi(configuration);
            
            let completion = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages,
                temperature, //độ đang sinh từ ngẩu nhiên của mô hình
                max_tokens:max_tokens  
            });

            console.log("---openai response : ---");
            console.log(completion.data.choices[0].message);
            
            let reponseAIText = completion.data.choices[0].message.content;

            return reponseAIText;
        }catch(e){
            console.log(e);
            return " ";
        }

    },

    //get AI reply for question buyer(buyer) (based on summarized chats history ) 
    GetAIReplyForBuyer: async function(buyer_facebook_psid,buyer,FanpageDetails,textReceivedMessage){
        try{
            //get prompt by fanpage_id 
            let PromptResult = redis.get(`prompt_by_fanpage_${FanpageDetails.fanpage_id}`);

            if(PromptResult==null){
                PromptResult = await promptModel.getPromptActivedByFanpageID({
                    fanpage_id:FanpageDetails.fanpage_id,
                    active:true
                });

                if(PromptResult.length > 0){
                    await redis.set(`prompt_by_fanpage_${FanpageDetails.fanpage_id}`, JSON.stringify(PromptResult));
                }
            }else{
                PromptResult = JSON.parse(PromptResult);
            }


            if(PromptResult.length == 0 ){
                return " Chưa train AI cho fanpage này.";
            }else if(PromptResult.length > 1 ){
                return " model AI actived for this fanpage > 1.";
            }else{
                PromptResult = PromptResult[0];
            }

            let messages=[];
            let summaryText="";
            //kiểm tra summary AI with buyer
            if(buyer.length != 0){
                summaryText=buyer[0].summary_text;
                messages.push({"role": "system", "content": `${PromptResult.content}. Biết nội dung tóm tắt của bạn và buyer trước đó là : ${summaryText}` });
            }else{
                messages.push({"role": "system", "content": `${PromptResult.content}.` });
            }

            messages.push({"role": "user", "content": `${textReceivedMessage}.` });
            
            let AIReply =await this.generateCompletion(messages,FanpageDetails,0.6,500);

            this.GetSummaryChats(buyer_facebook_psid,buyer,summaryText,textReceivedMessage,AIReply,FanpageDetails);
            
            return AIReply;
        }catch(e){
            console.log(e);
            return false;
        }
    },

    GetSummaryChats: async function(buyer_facebook_psid,buyer,summaryText,textBuyerSend,AIReply,FanpageDetails) {
        try{

            let messages=[];

            if(summaryText === ""){
                messages=[
                    {"role": "system", "content": `Tóm tắt cuộc trò chuyện sau bằng đoạn văn nhiều nhất là 100 chữ "` }
                ];
            }else{
                messages=[
                    {"role": "system", "content": `Tóm tắt cuộc trò chuyện sau bằng đoạn văn nhiều nhất là 100 chữ biết : Nội dung cuộc trò chuyện lúc trước là "${summaryText}"` }
                ];
            }
            messages.push( {"role": "user", "content": `${textBuyerSend}` });
            messages.push(  {"role": "assistant", "content": `${AIReply}` });


            let AIReplySummary =await this.generateCompletion(messages,FanpageDetails,0.7,1000);
            console.log("\n\n\n---------------sau tóm tắt -----------");
            console.log(AIReplySummary);
            console.log("--------------------------------------\n\n\n\n");

            if(buyer.length==0){

                let valueInfo={
                    FanpageDetails,
                    buyer_facebook_psid,
                    AIReplySummary,
                    type : "add"
                };
                //send to queue rabbitMQ for add buyer to DB
                rabbitMQ.producerRabbitMQ(JSON.stringify(valueInfo));
                
            }else{

                let valueInfo={
                    FanpageDetails,
                    buyer_facebook_psid,
                    buyer,
                    type : "update"
                };

                //send to rabbitMQ for update infomation(facebook name,..) buyer to DB
                rabbitMQ.producerRabbitMQ(JSON.stringify(valueInfo));

                // redis update summary text of buyer
                // because when add new buyer(in DB) then next message in redis had infomation of buyer
                // so just update as redis then reduce the number of inserts to DB after each message sent by the buyer.
                let BuyerDetails = await redis.get(`buyer_fanpageid_${FanpageDetails.fanpage_id}_fbid_${buyer_facebook_psid}`) ;

                if(BuyerDetails!=null){

                    BuyerDetails = JSON.parse(BuyerDetails);

                    if(BuyerDetails.length > 0){
                        BuyerDetails[0].summary_text=AIReplySummary;
                        await redis.set(`buyer_fanpageid_${FanpageDetails.fanpage_id}_fbid_${buyer_facebook_psid}`, JSON.stringify(BuyerDetails));
                    }

                }
                
            }

        }catch(e){
            console.log(e);
        }

    }

}


/***
 * openai document: 
 * https://platform.openai.com/docs/api-reference/chat/create
 * https://platform.openai.com/docs/guides/chat/introduction?_hsmi=248340301
 * 
 * ***/