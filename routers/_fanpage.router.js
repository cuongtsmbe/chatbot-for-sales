const fanpageModel = require("../models/fanpage.model");
const LINK = require("../util/links.json");
const config    =require("../config/default.json");

module.exports = {
    fanpageRouters:function(app){
        app.get(    LINK.CLIENT.FANPAGE_GET_BY_STATUS                ,this.getByStatusAndUserID);
        app.get(    LINK.CLIENT.FANPAGE_GET_ONE_BY_FANPAGE_ID        ,this.getOneByUserIDAndFanpageID);
        app.put(    LINK.CLIENT.FANPAGE_UPDATE_ACTIVE_BY_ID          ,this.updateActiveByUserIDAndFanpageID);
        app.delete( LINK.CLIENT.FANPAGE_DELETE_ID                    ,this.deleteByUserIDAndFanpageID);
    },

    //get list fanpage by UserID(of Account login) and status
    getByStatusAndUserID:async function(req,res,next){
        //set default page
        if(isNaN(req.query.page) || req.query.page<=0 ){
            req.query.page=1;
        }

        var condition={
            user_id                 : req.user.user_id,
            status                  : req.params.status,
            limit                   : config.limitFanpage,
            offset                  : config.limitFanpage*(req.query.page-1)
        };

        try{

            //status not a number in [0;2]
            if(isNaN(condition.status) || parseInt(condition.status)<0 || parseInt(condition.status)>3){
                return res.status(400).json({
                    code:41,
                    message:"status must be number in [0;2]."
                });
            }
        
            var [count,result]=await Promise.all([
                fanpageModel.countListByStatusAndUserId(condition),
                fanpageModel.getListByStatusAndUserId(condition)
            ]);
        }catch(e){
            console.log(e);
            return res.status(500).send("server error ");
        }

        return res.status(200).json({
            code:20,
            datalength:result.length,
            data:result,
            countAll:count[0],
            PageCurrent:req.query.page,
            TotalPage:Math.ceil(1.0*count[0].count/config.limitFanpage)
        })

    },


    //get one by condition fanpage_id and user_id (uuid)
    getOneByUserIDAndFanpageID:async function(req,res,next){
        var condition={
            fanpage_id  :req.params.fanpage_id,
            user_id     :req.user.user_id
        };
        
        try{
            //get result in DB
            var result= await fanpageModel.getOneByUserIDAndFanpageID(condition);

        }catch(e){
            console.log(e);
            return res.status(500).send("server error ");
        }

        return res.status(200).json({
            code:20,
            data:result
        })
    },

    //update active by fanpage id and user id
    updateActiveByUserIDAndFanpageID:async function(req,res,next){
        var condition={
            fanpage_id          :req.params.fanpage_id,
            user_id             :req.user.user_id
        }
        var value={
            active              :req.body.active,       //role type need update
        };

        //check active 
        if(!value.active){
            return res.status(400).json({
                code:40,
                message:"active is required."
            });
        }

        if (String(value.active).toLowerCase() != "true" && String(value.active).toLowerCase() != "false") {
            // active không phải là kiểu boolean
            return res.status(400).json({
                code:41,
                message:"active must be boolean"
            });
        }

        try{
            //cover string "true" or "false" to boolean
            value.active = JSON.parse(String(value.active).toLowerCase());

            //check data of user(account) exist in DB
            var resultGetOne= await fanpageModel.getOneByUserIDAndFanpageID(condition);  

           
            if(resultGetOne.length==0){
                //fanpage id not of user(account login) or fanpage_id not exist
                return res.status(400).json({
                    code:42,
                    message:`update active of ${condition.fanpage_id} khong thanh cong`
                })
            }
            //update to Db
            var result=await fanpageModel.update({fanpage_id:condition.fanpage_id},value);

            if(result.length == 0 || result.affectedRows==0){
                return res.status(400).json({
                        code:42,
                        message:`update active of ${condition.fanpage_id} khong thanh cong`
                    })
            }
            return  res.status(200).json({
                        status:20,
                        message:`update active of ${condition.fanpage_id} thanh cong`
                    })

        }catch(e){
            console.log(e);
            return res.status(500).json({
                    code:50,
                    message:"server error "
                });
        }

      
    },

    //delete fanpage by fanpage_id and user id (change status to 0 and active is false) 
    deleteByUserIDAndFanpageID: async function(req,res,next){
        //condition fanpage_id
        var condition={
            fanpage_id          :req.params.fanpage_id,
            user_id             :req.user.user_id
        }
        var value={
            active       : false,
            status       : 0,       // 0 is deteted
        };

        try{
            //check data of user(account login) exist in DB
            var resultGetOne= await fanpageModel.getOneByUserIDAndFanpageID(condition);  
            
            if(resultGetOne.length==0){
                //fanpage id not of user(account login) or fanpage_id not exist
                return res.status(400).json({
                    code:41,
                    message:`delete ${condition.fanpage_id} not success`
                })
            }

            //update to Db
            var result=await fanpageModel.update({fanpage_id:condition.fanpage_id},value);

            if(result.length==0 || result.affectedRows==0){
                return res.status(400).json({
                        code:41,
                        message:`delete ${condition.fanpage_id} not success`
                    })
            }
            return  res.status(200).json({
                        status:20,
                        message:`delete ${condition.fanpage_id} success`
                    })
        }catch(e){
            console.log(e);
            return res.status(500).json({
                    code:50,
                    message:"server error "
                });
        }

    }
}