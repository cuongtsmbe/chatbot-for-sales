const fanpageModel = require("../models/fanpage.model");
const LINK = require("../util/links.json");
const config    =require("../config/default.json");
const graphFacebook = require("../util/graphFacebook");
const {validateFanpageUserRegister} = require("../util/validation");

module.exports = {
    fanpageRouters:function(app){
        app.get(    LINK.CLIENT.FANPAGE_GET_BY_STATUS                ,this.getByStatusAndUserID);
        app.get(    LINK.CLIENT.FANPAGE_GET_ONE_BY_FANPAGE_ID        ,this.getOneByUserIDAndFanpageID);
        app.get(    LINK.CLIENT.FANPAGE_GET_ALL_FANPAGE_MANAGED      ,this.getAllFanpageManageByUserFB);
        app.post(   LINK.CLIENT.FANPAGE_ADD_NEW                      ,this.addNewFanpage);
        app.post(   LINK.CLIENT.FANPAGE_REGISTER_WEBHOOKS_BY_PAGEID  ,this.registerWebhooksForFanpageID);
        app.put(    LINK.CLIENT.FANPAGE_UPDATE_ACTIVE_BY_ID          ,this.updateActiveByUserIDAndFanpageID);
        app.put(    LINK.CLIENT.FANPAGE_UPDATE_OPENAIKEY_BY_ID       ,this.updateOpenAIKeyByUserIDAndFanpageID);
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
            limit                   : config.limit.fanpage,
            offset                  : config.limit.fanpage*(req.query.page-1)
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
            TotalPage:Math.ceil(1.0*count[0].count/config.limit.fanpage)
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

    //lấy các fanpage được quản lý bởi user_access_token
    getAllFanpageManageByUserFB:async function(req,res,next){
        var condition= {
            user_short_live_access_token: req.query.user_short_live_access_token
        };

        if(!condition.user_short_live_access_token){ 
            return res.status(400).json({
                code:40,
                data:"token is empty . please check token and try again."
            });
        }

        var result=await graphFacebook.getListFanpagesManagedByUserAccesstoken(condition.user_short_live_access_token);

        if(result==null){
            return res.status(500).json({
                code:50,
                data:"server error . Try late ."
            });
        }

        return res.status(200).json({
            code:20,
            data:result
        });
    },

    addNewFanpage:async function(req,res,next){
        var conditionConnect ={
            user_short_live_access_token: req.body.user_short_live_access_token,
            fanpage_id: req.body.fanpage_id
        };

        var value={
            fanpage_id              :req.body.fanpage_id,
            key_fanpage             :"empty",                        
            key_open_ai             :req.body.key_open_ai,           
            name                    :req.body.name,         
            active                  :req.body.active,         
            user_id                 :req.user.user_id,        
            payment_due_date        :req.body.payment_due_date, 
            status                  :1         
        };
        
        if(!value.fanpage_id){
            return res.status(400).json({
                code:40,
                message:"fanpage_id không được để trống ."
            });
        }

        //set page access token  
        if(!conditionConnect.fanpage_id || !conditionConnect.user_short_live_access_token){
            value.key_fanpage="empty";
        }else{
            var page_access_token = await graphFacebook.subscribeToPageWebhooks(conditionConnect.fanpage_id,conditionConnect.user_short_live_access_token,null);
            
            if(page_access_token==null || page_access_token==false){
                value.key_fanpage="empty";
            }else{
                value.key_fanpage=page_access_token;
            }
        }

        //user_id(UUID) validate
        if(validateUuid(value.user_id) !== true){
                return  res.status(400).json({
                    code:40,
                    message: "Invalid user_id(UUID) format",
                });
        }

        //validate input value
        var validationResult=validateFanpageUserRegister(value);
    
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
                    message: "Had limited fanpage in server .Please contact developer/admin for more information .",
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
            if(value.key_fanpage=="empty"){
                return  res.status(200).json({
                        status:21,
                        message:"Them fanpage thanh cong",
                        messageConnectWebhooks: "Chưa đăng kí webhooks cho fanpage."
                    })
            }

            return  res.status(200).json({
                    status:20,
                    message:"Them fanpage thanh cong",
                    messageConnectWebhooks: "Đăng kí webhooks cho fanpage thành công."
                })
           

        }catch(e){
            console.log(e);
            return res.status(500).json({
                    code:50,
                    message:"server error "
                });
        }

    },

    registerWebhooksForFanpageID:async function(req,res,next){
        var condition= {
            user_short_live_access_token: req.body.user_short_live_access_token,
            fanpage_id                  : req.params.fanpage_id,
            user_id                     : req.user.user_id
        };

        if(!condition.fanpage_id || !condition.user_short_live_access_token){
            return res.status(400).json({
                code:40,
                message:"require fanpage_id and user short lived access token."
            });
        }

        try{

            var resultGetOne= await fanpageModel.getOneByUserIDAndFanpageID({
                fanpage_id          :condition.fanpage_id,
                user_id             :condition.user_id
            });  
           
            if(resultGetOne.length==0){
                return res.status(400).json({
                    code:42,
                    message:`Not found fanpage ${condition.fanpage_id} .`
                })
            }

            if(resultGetOne[0].status == 0){
                return res.status(400).json({
                    code:43,
                    message:`register webhooks fail. Because fanpage ${condition.fanpage_id} had deleted.`
                })
            }
        }catch(e){
            console.log(e);
            return res.status(500).json({
                code:54,
                message:`Error server.`
            });
        }
       
        var page_access_token = await graphFacebook.subscribeToPageWebhooks(condition.fanpage_id,condition.user_short_live_access_token,null);
        
        if(page_access_token==null){
            return res.status(500).json({
                code:50,
                message:"server error . Try late ."
            });
        }

        if(page_access_token==false){
            return res.status(500).json({
                code:53,
                message:"register webhooks fail."
            });
        }
  

        try{
            var result=await fanpageModel.update({fanpage_id:condition.fanpage_id},{key_fanpage:page_access_token});

            if(result.length == 0 || result.affectedRows==0){
                throw new Error("throw new Error : update fanpage mysql fail of router FANPAGE_REGISTER_WEBHOOKS_BY_PAGEID.");
            }
        }catch(e){
            console.log(e);
            return res.status(500).json({
                code:52,
                message:`Register webhooks success.But can't set key fanpage for this fanpage. Try again or report for admin.`
            });
        }

        return res.status(200).json({
            code:20,
            data:"register webhooks success."
        });
    },

    //update active by fanpage id and user id
    updateActiveByUserIDAndFanpageID:async function(req,res,next){
        var condition={
            fanpage_id          :req.params.fanpage_id,
            user_id             :req.user.user_id
        }
        var value={
            active              :req.body.active,      
        };

        if(!value.active){
            return res.status(400).json({
                code:40,
                message:"active is required."
            });
        }

        if (String(value.active).toLowerCase() != "true" && String(value.active).toLowerCase() != "false") {
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
                    code:44,
                    message:`Not found fanpage ${condition.fanpage_id} .`
                })
            }

            //fanpage had deteted/blocked
            if(resultGetOne[0].status!=1){
                return res.status(400).json({
                    code:43,
                    message:`update fail.Fanpage ${condition.fanpage_id} had deleted/blocked .`
                })
            }
       
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

    //update openai key
    updateOpenAIKeyByUserIDAndFanpageID:async function(req,res,next){
        var condition={
            fanpage_id          :req.params.fanpage_id,
            user_id             :req.user.user_id
        }
        var value={
            key_open_ai              :req.body.key_open_ai,      
        };

        if(!value.key_open_ai){
            return res.status(400).json({
                code:40,
                message:"key_open_ai is required."
            });
        }

        try{

            //check data of user(account) exist in DB
            var resultGetOne= await fanpageModel.getOneByUserIDAndFanpageID(condition);  
           
            if(resultGetOne.length==0){
                //fanpage id not of user(account login) or fanpage_id not exist
                return res.status(400).json({
                    code:42,
                    message:`Not found fanpage ${condition.fanpage_id} .`
                })
            }

            if(resultGetOne[0].status==0){
                return res.status(400).json({
                    code:43,
                    message:`update fail. Because fanpage ${condition.fanpage_id} could deleted.`
                })
            }
       
            var result=await fanpageModel.update({fanpage_id:condition.fanpage_id},value);

            if(result.length == 0 || result.affectedRows==0){
                return res.status(400).json({
                        code:42,
                        message:`update openai key of ${condition.fanpage_id} khong thanh cong`
                    })
            }
            return  res.status(200).json({
                        status:20,
                        message:`update openai key of ${condition.fanpage_id} thanh cong`
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

            let resUnsub = await graphFacebook.unsubscribeFromPageWebhooks(condition.fanpage_id);
            if(!resUnsub){
                resUnsub="unsubscribe from page webhooks fail."
            }else{
                value={
                    active       : false,
                    status       : 0,       // 0 is deteted
                    key_fanpage  : "empty"
                };
                resUnsub="unsubscribe from page webhooks success."
            }

            var result=await fanpageModel.update({fanpage_id:condition.fanpage_id},value);

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
                    });
        }catch(e){
            console.log(e);
            return res.status(500).json({
                    code:50,
                    message:"server error "
                });
        }

    }
}