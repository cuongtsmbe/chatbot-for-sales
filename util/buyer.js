const { v4: uuidv4 } = require("uuid"); 
const handleFacebook = require("./handleFacebook");
const buyerModel  = require("../models/buyer.model");
const config = require("../config/default.json");


module.exports = {

    addNewBuyer:async function(FanpageDetails,buyer_facebook_psid,AIReplySummary){
            //get profile facebook by psid
            const dataInfo=handleFacebook.getFacebookUserInfo(FanpageDetails.key_fanpage,buyer_facebook_psid);
            let profile_name="khong lay duoc ten.";
            let profile_pic="khong lay duoc image";

            //get time for add new buyer
            let currentTime = new Date();
                currentTime = currentTime.toISOString();// cover format ISO 8601 for mysql

            if(dataInfo!=null){
                try{
                    profile_name = dataInfo.first_name+" "+dataInfo.last_name;
                    profile_pic=dataInfo.profile_pic;
                }catch(e){
                    console.log(e);
                }
            }

            //add buyer to DB
            return await 
                buyerModel.add({
                    buyer_id    :uuidv4(),
                    profile_name:profile_name,
                    profile_pic :profile_pic,
                    facebook_id :buyer_facebook_psid,
                    fanpage_id  :FanpageDetails.fanpage_id,
                    active      :true,
                    summary_text:AIReplySummary,
                    modified_user_date : currentTime
                });
    },

    //update user info after the number of pre-configured days
    updateFacebookUserInfo:async function(buyer,FanpageDetails,buyer_facebook_psid){
            //get current date and dbdate 
            const dbDate = new Date(buyer[0].modified_user_date);
            const currentDate = new Date();
            const diffTime = Math.abs(currentDate - dbDate);//khoảng cách thời gian giữa hai ngày tính bằng milisecond
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
            //if diffDays large than day in config then check and update profile for buyer
            if(diffDays > config.daysNumberCheckAndUpdateProfileBuyer){

                //get profile facebook by psid
                const dataInfo=handleFacebook.getFacebookUserInfo(FanpageDetails.key_fanpage,buyer_facebook_psid);
                let profile_name="khong lay duoc ten.";
                let profile_pic="khong lay duoc image";

                if(dataInfo!=null){
                        profile_name = dataInfo.first_name+" "+dataInfo.last_name;
                        profile_pic=dataInfo.profile_pic;
                }

                //if picture or name different then update
                if(buyer[0].profile_name !== profile_name || buyer[0].profile_pic !== profile_pic){

                    let modified_user_date = currentDate.toISOString();// cover format ISO 8601 for mysql

                    //update profile
                    return await 
                        buyerModel.update({
                            buyer_id    :buyer[0].buyer_id
                        },{
                            profile_name,
                            profile_pic,
                            modified_user_date
                        });

                }

            }

    }

}