const fanpageModel = require("../models/fanpage.model");
const userModel = require("../models/user.model");
const limit_fanpageModel = require("../models/limit_fanpage.model");
const LINK = require("../util/links.json");
const config    =require("../config/default.json");
const { validate: validateUuid } = require("uuid");
const {validateFanpageInput} = require("../util/validation");
const graphFacebook = require("../util/graphFacebook");

module.exports = {
    fanpageRouters:function(app){
        app.get(    LINK.ADMIN.FANPAGE_GET_ALL                              ,this.get);
        app.get(    LINK.ADMIN.FANPAGE_GET_BY_USER_ID_AND_STATUS            ,this.getByStatusAndUserID);
        app.get(    LINK.ADMIN.FANPAGE_GET_BY_CONDITION                     ,this.getByCondition);
        app.get(    LINK.ADMIN.FANPAGE_GET_DETAILS_BY_ID                    ,this.getOneByFanpageID);
        app.post(   LINK.ADMIN.FANPAGE_ADD_NEW                              ,this.add);
        app.post(   LINK.ADMIN.FANPAGE_UNSUBSCRIBE_WEBHOOKS                 ,this.unsubscribeFromPageWebhooks);
        app.put(    LINK.ADMIN.FANPAGE_UPDATE_BY_ID                         ,this.update);
        app.put(    LINK.ADMIN.FANPAGE_UPDATE_STATUS_BY_ID                  ,this.updateStatusByFanpageID);
        app.put(    LINK.ADMIN.FANPAGE_UPDATE_ACTIVE_BY_ID                  ,this.updateActive);
        app.delete( LINK.ADMIN.FANPAGE_DELETE_BY_ID                         ,this.delete);
    },

    //get fanpage by page
    get:async function(req,res,next){
        if(isNaN(req.query.page) || req.query.page<=0 ){
            req.query.page=1;
        }

        var condition={
            limit       :config.limit.fanpage,
            offset      :config.limit.fanpage*(req.query.page-1),
        };

        try{
            var [count,result]=await Promise.all([
                fanpageModel.countAll(),
                fanpageModel.getList(condition)
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
            TotalPage:Math.ceil(1.0*count[0].count/config.limit.fanpage)
        })

    },

    //get list fanpage by UserID and status
    getByStatusAndUserID:async function(req,res,next){
        if(isNaN(req.query.page) || req.query.page<=0){
            req.query.page=1;
        }

        var condition={
            user_id                 : req.params.user_id,
            status                  : req.params.status,
            limit                   : config.limit.fanpage,
            offset                  : config.limit.fanpage*(req.query.page-1)
        };

        try{
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
            TotalPage:Math.ceil(1.0*count[0].count/config.limit.fanpage)
        })

    },

    //get list fanpage by condition(status,name,payment_due_date,page)
    getByCondition:async function(req,res,next){
        if(isNaN(req.query.page) || req.query.page<=0){
            req.query.page=1;
        }

        var condition={
            payment_due_date_start  : req.query.payment_due_date_start,
            payment_due_date_end    : req.query.payment_due_date_end,
            name                    : req.query.name,
            limit                   : config.limit.fanpage,
            offset                  : config.limit.fanpage*(req.query.page-1),
            status                  : req.query.status
        };

        try{
            var [count,result]=await Promise.all([
                fanpageModel.countFanpagesByCondition(condition),
                fanpageModel.getFanpagesByCondition(condition)
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
            TotalPage:Math.ceil(1.0*count[0].count/config.limit.fanpage)
        })

    },

    //get one by condition fanpage id (uuid)
    getOneByFanpageID:async function(req,res,next){
        var condition={
            fanpage_id:req.params.fanpage_id
        };
        
        try{
            var result= await fanpageModel.getOne(condition);

        }catch(e){
            console.log(e);
            return res.status(500).send("server error ");
        }

        return res.status(200).json({
            code:20,
            data:result
        })
    },



    //add new fanpage
    add:async function(req,res,next){

        var value={
            fanpage_id              :req.body.fanpage_id,           
            key_fanpage             :req.body.key_fanpage,             
            key_open_ai             :req.body.key_open_ai,           
            name                    :req.body.name,         
            active                  :req.body.active,         
            user_id                 :req.body.user_id,        
            payment_due_date        :req.body.payment_due_date, 
            status                  :1         
        };
        
        if(!value.fanpage_id){
            return res.status(400).json({
                code:40,
                message:"fanpage_id không hợp lệ."
            });
        }
        
        //user_id(UUID) validate
        if(validateUuid(value.user_id) !== true){
                return  res.status(400).json({
                    code:40,
                    message: "Invalid user_id(UUID) format",
                });
        }

        //validate input value
        var validationResult=validateFanpageInput(value);
    
        if ( validationResult !== true) {
            return res.status(400).json({
                code:40,
                message:validationResult
            });

        } 

        try{
            //cover string "true" or "false" to boolean
            value.active = JSON.parse(String(value.active).toLowerCase());
            //get all row in limit
            var resultLimit=await limit_fanpageModel.getAll();

            if(resultLimit.length == 0 || resultLimit.length > 1){
                //response if rows limit  > 1 or don't have data
                return  res.status(400).json({
                    code:43,
                    message: "Had limited fanpage in server .Please contact developer for more information .",
                });
            }

            var countFanpageActivedInServer = await fanpageModel.countAllFanpageActived();

            //check fanpage active in server had limited 
            if(value.active == true && countFanpageActivedInServer[0].count >= resultLimit[0].count){
                return  res.status(400).json({
                    code:43,
                    message: "Had limited fanpage in server .Please contact developer for more information .",
                });
            }

            //check fanpage id in DB
            var dataFanpage = await fanpageModel.getOne({fanpage_id:value.fanpage_id});

            if(dataFanpage.length>0){
                return res.status(400).json({
                    code:41,
                    message:`Them khong thanh cong. fanpage ${value.fanpage_id} had exist`
                });
            }

            //connect webhooks and fanpage 
            var page_access_token = await graphFacebook.subscribeToPageWebhooks(value.fanpage_id,null,value.key_fanpage);
                
            if(page_access_token==null || page_access_token==false){
                return  res.status(400).json({
                    code:40,
                    message: "subscribe fanpage with webhooks fail.because maybe because 'key_fanpage' or FB api error.",
                });
            }

            //check user_id exist in DB
            var dataUser = await userModel.getOne({user_id:value.user_id});

            if(dataUser.length==0){
                return res.status(400).json({
                    code:42,
                    message:`Them khong thanh cong. user ${value.user_id} not exist`
                });
            }

            var result=await fanpageModel.add(value);

            if(result.length == 0 || result.affectedRows==0){
                return res.status(400).json({
                        code:44,
                        message:"Them khong thanh cong"
                    })
            }
            return  res.status(200).json({
                        status:20,
                        message:"Them thanh cong"
                    })

        }catch(e){
            console.log(e);
            return res.status(500).json({
                    code:50,
                    message:"server error "
                });
        }

       
        
    },

  
    unsubscribeFromPageWebhooks:async function(req,res,next){
        var condition={
                fanpage_id              :req.params.fanpage_id
        }

        try{
            //check fanpage id in DB
            var dataFanpage = await fanpageModel.getOne({fanpage_id:condition.fanpage_id});

            if(dataFanpage.length==0){
                return res.status(400).json({
                    code:41,
                    message:`Them khong thanh cong. fanpage ${condition.fanpage_id} isn't exist`
                });
            }
        
            let result=await fanpageModel.update(condition,{key_fanpage:"empty"});

            if(result.length == 0 || result.affectedRows==0){
                throw new Error("Server error.unsubscribe fanpage not success . Vì không thể cập nhật fanpage key thành 'empty'.");
            }

            var resUnsub = await graphFacebook.unsubscribeFromPageWebhooks(condition.fanpage_id);

            if(!resUnsub){
                //unsubscribe fail . then need update key fanpage again.
                let result=await fanpageModel.update(condition,{key_fanpage:dataFanpage[0].key_fanpage});

                if(result.length == 0 || result.affectedRows == 0){
                    throw new Error(`Server error.unsubscribe fanpage ${condition.fanpage_id} not success .But key fanpage had change to 'empty'.`);
                }

                return res.status(500).json({
                    code:50,
                    message:"unsubscribe from page webhooks fail.",
                });

            }
        }catch(e){
            console.log(e);
            return res.status(500).json({
                code:51,
                message:`serve error.`,
            });
        }
       

        return  res.status(200).json({
            status:20,
            messageUnsubscribe:"unsubscribe from page webhooks success."
        })

    },

    //update fanpage value by fanpage_id 
    update:async function(req,res,next){
        //condition fanpage_id
        var condition={
            fanpage_id     :req.params.fanpage_id
        }

        //value need update
        var value={      
            key_fanpage             :req.body.key_fanpage,             
            key_open_ai             :req.body.key_open_ai,           
            name                    :req.body.name,         
            active                  :req.body.active,         
            user_id                 :req.body.user_id,        
            payment_due_date        :req.body.payment_due_date,  
            status                  :req.body.status        
        };

        //user_id(UUID) validate
        if(validateUuid(value.user_id) !== true){
                return  res.status(400).json({
                    code:40,
                    message: "Invalid user_id(UUID) format",
                });
        }

        if(!value.active){
            return  res.status(400).json({
                code:40,
                message: "active is required.",
            });
        }

        try{
            //kiem tra status is number 
            if(isNaN(value.status) || parseInt(value.status)<0 || parseInt(value.status)>2){
                return res.status(400).json({
                    code:40,
                    message:"status require is number from 0 to 2."
                });
            }
        }catch(e){
            console.log(e);
            return res.status(400).json({
                    code:40,
                    message:"status require is number from 0 to 2. "
                });
        }

        //validate input value
        var validationResult=validateFanpageInput(value);
    
        if ( validationResult !== true) {
            return res.status(400).json({
                code:40,
                message:validationResult
            });

        } 

       

        try{
            //cover string "true" or "false" to boolean
            value.active = JSON.parse(String(value.active).toLowerCase());

            if(value.status!=1 && value.active==true) {
                return  res.status(400).json({
                    code:44,
                    message: "If the status is not normal, then the 'active' field should be set to false.",
                });
            }

            if(value.status==0){
                let resUnsub = await graphFacebook.unsubscribeFromPageWebhooks(condition.fanpage_id);
                if(resUnsub){
                    value.key_fanpage="empty";
                }else if(value.key_fanpage=="empty"){
                    return  res.status(400).json({
                        code:44,
                        message: "unsubcsribe webhooks failed ,then the 'key_fanpage' field should be set to 'empty'.",
                    });
                }
            }

            if(value.status!=0 && value.key_fanpage=="empty"){
                return  res.status(400).json({
                    code:44,
                    message: "If the status isn't delete, then the 'key_fanpage' field should not set to 'empty'.",
                });
            }



            //get all row in limit
            var resultLimit=await limit_fanpageModel.getAll();

            if(resultLimit.length == 0 || resultLimit.length > 1){
                //response if rows limit  > 1 or don't have data
                return  res.status(400).json({
                    code:43,
                    message: "Had limited fanpage in server .Please contact developer for more information .",
                });
            }

            var detailsFanpage= await fanpageModel.getOne(condition);

            if(detailsFanpage.length == 0 ){
                return  res.status(400).json({
                    code:43,
                    message: `fanpage ${condition.fanpage_id} not exist.`,
                });
            }
            detailsFanpage = detailsFanpage[0];

            var countFanpageActivedInServer = await fanpageModel.countAllFanpageActived();

            //check fanpage active in server had limited 
            if(value.active === true && detailsFanpage.active != true && countFanpageActivedInServer[0].count >= resultLimit[0].count){
                //nếu fanpage muốn active là true và update cho fanpage false và số lượng fanpage active cho phep đã đạt giới hạn (limit) 
                return  res.status(400).json({
                    code:43,
                    message: "Had limited fanpage in server .Please contact developer for more information .",
                });
            }

            //check user_id exist in DB
            var dataUser = await userModel.getOne({user_id:value.user_id});

             if(dataUser.length==0){
                 return res.status(400).json({
                     code:41,
                     message:`user ${value.user_id} not exist`
                 });
            }

            var result=await fanpageModel.update(condition,value);

            if(result.length==0 || result.affectedRows==0){
                return res.status(400).json({
                        code:42,
                        message:`update ${condition.fanpage_id} khong thanh cong`
                    })
            }
            return  res.status(200).json({
                        status:20,
                        message:`update ${condition.fanpage_id} thanh cong`
                    })
        }catch(e){
            console.log(e);
            return res.status(500).json({
                    code:50,
                    message:"server error "
                });
        }
       
        
    },

    updateStatusByFanpageID:async function(req,res,next){
        var condition={
            fanpage_id         :req.params.fanpage_id
        }
        var value={
            status       :req.body.status,     
        };

        try{
            //kiem tra status is number 
            if(isNaN(value.status) || parseInt(value.status)<0 || parseInt(value.status)>2){
                return res.status(400).json({
                    code:40,
                    message:"status require is number from 0 to 2."
                });
            }
        }catch(e){
            console.log(e);
            return res.status(400).json({
                    code:40,
                    message:"status require is number from 0 to 2. "
                });
        }

        try{
           
            if(value.status != 1){
                value={
                    status      : value.status,
                    active      : false  
                };
            }

            //delete
            if(value.status==0){
                let resUnsub = await graphFacebook.unsubscribeFromPageWebhooks(condition.fanpage_id);

                if(resUnsub){
                    value={
                        active       : false,
                        status       : 0,
                        key_fanpage  : "empty"
                    };
                }
            }

            var result=await fanpageModel.update(condition,value);

            if(result.length == 0 ||  result.affectedRows==0){
                return res.status(400).json({
                        code:42,
                        message:`update status of ${condition.fanpage_id} khong thanh cong`
                    })
            }
            return  res.status(200).json({
                        status:20,
                        message:`update status of ${condition.fanpage_id} thanh cong`
                    })
        }catch(e){
            console.log(e);
            return res.status(500).json({
                    code:50,
                    message:"server error "
                });
        }

       
    },

    //update active by fanpage id
    updateActive:async function(req,res,next){
        var condition={
            fanpage_id         :req.params.fanpage_id
        }
        var value={
            active       :req.body.active,     
        };


        if (String(value.active).toLowerCase() != "true" && String(value.active).toLowerCase() != "false") {
            return res.status(400).json({
                code:41,
                message:"active must be boolean"
            });
        }

        try{
            
            var resultPageByID= await fanpageModel.getOne(condition);

            if(resultPageByID.length == 0 ){
                return res.status(400).json({
                    code:44,
                    message:`Fanpage ${condition.fanpage_id} not exist.`
                });
            }else{
                resultPageByID = resultPageByID[0];

                if(resultPageByID.status!=1){
                    return res.status(400).json({
                        code:45,
                        message:`Fanpage ${condition.fanpage_id} can't not update .Because this fanpage had deleted/blocked.`
                    });
                }

            }

            //cover string "true" or "false" to boolean
            value.active = JSON.parse(String(value.active).toLowerCase());
            //get all row in limit
            var resultLimit=await limit_fanpageModel.getAll();

            if(resultLimit.length == 0 || resultLimit.length > 1){
                //response if rows limit  > 1 or don't have data
                return  res.status(400).json({
                    code:43,
                    message: "Had limited fanpage in server .Please contact developer for more information .",
                });
            }

            //get count all fanpage actived in server
            var countFanpageActivedInServer = await fanpageModel.countAllFanpageActived();

            //check fanpage active in server had limited 
            if(value.active == true && countFanpageActivedInServer[0].count >= resultLimit[0].count){
                return  res.status(400).json({
                    code:43,
                    message: "Had limited fanpage in server .Please contact developer for more information .",
                });
            }

            var result=await fanpageModel.update(condition,value);

            if(result.length == 0 ||  result.affectedRows==0){
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



    //delete fanpage by fanpage_id (change status to 0 and active is false) 
    delete: async function(req,res,next){
        var condition={
            fanpage_id         :req.params.fanpage_id
        }
        var value={
            active       : false,
            status       : 0,       // 0 is deteted
        };

        try{
            let resUnsub = await graphFacebook.unsubscribeFromPageWebhooks(condition.fanpage_id);
            if(!resUnsub){
                resUnsub="unsubscribe from page webhooks fail."
            }else{
                value={
                    active       : false,
                    status       : 0,
                    key_fanpage  : "empty"
                };
                resUnsub="unsubscribe from page webhooks success."
            }
            var result=await fanpageModel.update(condition,value);

            if(result.length==0 || result.affectedRows==0){
                return res.status(400).json({
                        code:41,
                        message:`delete ${condition.fanpage_id} not success`,
                        messageUnsubscribe:resUnsub
                    })
            }
            return  res.status(200).json({
                        status:20,
                        message:`delete ${condition.fanpage_id} success`,
                        messageUnsubscribe:resUnsub
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
