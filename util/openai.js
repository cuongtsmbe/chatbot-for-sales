const {Configuration, OpenAIApi} = require("openai");
require('dotenv').config();
const promptModel = require("../models/prompt.model");
const buyerModel  = require("../models/buyer.model");
const { v4: uuidv4 } = require("uuid"); 

module.exports={

    //send prompt to openAI and return text(String) result
    generateCompletion: async function(messages,FanpageDetails,temperature=0.7) {

        let configuration = new Configuration({
            apiKey: FanpageDetails.key_open_ai,
          });
          let openai = new OpenAIApi(configuration);
          
        let completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages,
            temperature, //độ đang sinh từ ngẩu nhiên của mô hình
            max_tokens: 4096 //chọn token tối đa cho câu hỏi và câu trả lời
        });

        console.log("---openai response : ---");
        console.log(completion.data.choices[0].message);
        
        let reponseAIText = completion.data.choices[0].message.content;

        return reponseAIText;

    },

    //get AI reply for question buyer(buyer) (based on summarized chats history ) 
    GetAIReplyForBuyer: async function(buyer_facebook_id,buyer,FanpageDetails,textReceivedMessage){
        //get prompt by fanpage_id
        let PromptResult = await promptModel.getPromptActivedByFanpageID({
            fanpage_id:FanpageDetails.fanpage_id,
            active:true
        });

        if(PromptResult.length == 0 ){
            return " Chưa train AI cho fanpage này.";
        }else if(PromptResult.length > 1 ){
            return " model AI actived for this fanpage > 1.";
        }else{
            PromptResult = PromptResult[0];
        }

        //messages for training AI 
        let  messages=[];
        let summaryText="";
        //kiểm tra summary AI with buyer
        if(buyer.length != 0){
             //buyer đã có tin nhắn với fanpage trước đây(có summary)
            summaryText=buyer[0].summary_text;
            messages.push({"role": "system", "content": `${PromptResult.content}. Biết nội dung tóm tắt của bạn và buyer trước đó là : ${summaryText}` });
        }else{
            //buyer nhắn đến fanpage lần đầu 
            messages.push({"role": "system", "content": `${PromptResult.content}.` });
        }

        //current messenger buyer send to fanpage 
        messages.push({"role": "user", "content": `${textReceivedMessage}.` });
        
        //send buyer to openAI and receive AI reply  
        let AIReply =await this.generateCompletion(messages,FanpageDetails,0.6);

        //require summary history and current chat(of AI and buyer)
        this.GetSummaryChats(buyer_facebook_id,buyer,summaryText,textReceivedMessage,AIReply,FanpageDetails);
        
        return AIReply;
    },

    //get summary chats of buyer from openAI
    GetSummaryChats: async function(buyer_facebook_id,buyer,summaryText,textBuyerSend,AIReply,FanpageDetails) {
        let messages=[];
        if(summaryText === ""){
            messages=[
                {"role": "system", "content": `Tóm tắt cuộc trò  chuyện sau biết "` }
            ];
        }else{
            messages=[
                {"role": "system", "content": `Tóm tắt cuộc trò  chuyện sau biết : Nội dung cuộc trò chuyện lúc trước là "${summaryText}"` }
            ];
        }
        messages.push( {"role": "user", "content": `${textBuyerSend}` });
        messages.push(  {"role": "you", "content": `${AIReply}` });


        let AIReplySummary =await this.generateCompletion(messages,FanpageDetails,0.7);
        console.log("\n\n\n---------------sau tóm tắt -----------");
        console.log(AIReplySummary);
        console.log("--------------------------------------\n\n\n\n");

        //add/update summary to DB
        if(buyer.length==0){
            //add buyer to DB
            await buyerModel.add({
                buyer_id    :uuidv4(),
                facebook_id :buyer_facebook_id,
                fanpage_id  :FanpageDetails.fanpage_id,
                active      :true,
                summary_text:AIReplySummary
            });
        }else{
            //update summary for buyer
            await buyerModel.update({
                buyer_id    :buyer[0].buyer_id
            },{
                summary_text:AIReplySummary
            });
        }

    }
}


/***
 * openai document: 
 * https://platform.openai.com/docs/api-reference/chat/create
 * https://platform.openai.com/docs/guides/chat/introduction?_hsmi=248340301
 * 
 * ***/