const {Configuration, OpenAIApi} = require("openai");
require('dotenv').config();
const promptModel = require("../models/prompt.model");
const buyerModel  = require("../models/buyer.model");
const { v4: uuidv4 } = require("uuid"); 
const handleFacebook = require("./handleFacebook");
const config = require("../config/default.json");

module.exports={

    //send prompt to openAI and return text(String) result
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
                max_tokens:max_tokens  //chọn token tối đa cho câu hỏi và câu trả lời
            });

            console.log("---openai response : ---");
            console.log(completion.data.choices[0].message);
            
            let reponseAIText = completion.data.choices[0].message.content;

            return reponseAIText;
        }catch(e){
            //max token 
            console.log(e);
            return " ";
        }

    },

    //get AI reply for question buyer(buyer) (based on summarized chats history ) 
    GetAIReplyForBuyer: async function(buyer_facebook_psid,buyer,FanpageDetails,textReceivedMessage){
        try{
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
            let AIReply =await this.generateCompletion(messages,FanpageDetails,0.6,500);

            //require summary history and current chat(of AI and buyer)
            this.GetSummaryChats(buyer_facebook_psid,buyer,summaryText,textReceivedMessage,AIReply,FanpageDetails);
            
            return AIReply;
        }catch(e){
            console.log(e);
            return false;
        }
    },

    //get summary chats of buyer from openAI
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

            //add/update summary to DB
            if(buyer.length==0){
                //get profile facebook by psid
                const dataInfo=handleFacebook.getFacebookUserInfo(FanpageDetails.key_fanpage,buyer_facebook_psid);
                let profile_name="khong lay duoc ten.";
                let profile_pic="khong lay duoc image";

                //get time for add new buyer
                let currentTime = new Date();
                    currentTime = currentTime.toISOString();// cover format ISO 8601 for mysql

                if(dataInfo!=null){
                    try{
                        profile_name = dataInfo.first_name+dataInfo.last_name;
                        profile_pic=dataInfo.profile_pic;
                    }catch(e){
                        console.log(e);
                    }
                }

                //add buyer to DB
                await buyerModel.add({
                    buyer_id    :uuidv4(),
                    profile_name:profile_name,
                    profile_pic :profile_pic,
                    facebook_id :buyer_facebook_psid,
                    fanpage_id  :FanpageDetails.fanpage_id,
                    active      :true,
                    summary_text:AIReplySummary,
                    modified_user_date : currentTime
                });

            }else{

                //get current date and dbdate 
                const dbDate = new Date(buyer[0].modified_user_date);
                const currentDate = new Date();
                const diffTime = Math.abs(currentDate - dbDate);//khoảng cách thời gian giữa hai ngày tính bằng milisecond
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
               
                //if diffDays large than day in config then check and update profile for buyer
                if(diffDays > config.daysNumberCheckAndUpdateProfileBuyer){
                    
                    //try-catch when error by dataInfo then continue update summary
                    try{

                        //get profile facebook by psid
                        const dataInfo=handleFacebook.getFacebookUserInfo(FanpageDetails.key_fanpage,buyer_facebook_psid);
                        let profile_name="khong lay duoc ten.";
                        let profile_pic="khong lay duoc image";

                        if(dataInfo!=null){
                                profile_name = dataInfo.first_name+dataInfo.last_name;
                                profile_pic=dataInfo.profile_pic;
                        }

                        //if picture or name different then update
                        if(buyer[0].profile_name !== profile_name || buyer[0].profile_pic !== profile_pic){

                            let modified_user_date = currentDate.toISOString();// cover format ISO 8601 for mysql
                            
                            //update profile
                            await buyerModel.update({
                                buyer_id    :buyer[0].buyer_id
                            },{
                                profile_name,
                                profile_pic,
                                modified_user_date
                            });

                        }

                    }catch(e){
                        console.log(e);
                    }
                }

                //update summary for buyer
                await buyerModel.update({
                    buyer_id    :buyer[0].buyer_id
                },{
                    summary_text:AIReplySummary
                });
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