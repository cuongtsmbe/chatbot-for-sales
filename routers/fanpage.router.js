const fanpageModel = require("../models/fanpage.model");
const userModel = require("../models/user.model");
const LINK = require("../util/links.json");
const config    =require("../config/default.json");
const { validate: validateUuid } = require("uuid");
const {validateFanpageInput} = require("../util/validation");


module.exports = {
    fanpageRouters:function(app){
        app.get(    LINK.ADMIN.FANPAGE_GET_ALL                              ,this.get);
        app.get(    LINK.ADMIN.FANPAGE_GET_BY_USER_ID_AND_STATUS            ,this.getByStatusAndUserID);
        app.get(    LINK.ADMIN.FANPAGE_GET_BY_CONDITION                     ,this.getByCondition);
        app.get(    LINK.ADMIN.FANPAGE_GET_DETAILS_BY_ID                    ,this.getOneByFanpageID);
        app.post(   LINK.ADMIN.FANPAGE_ADD_NEW                              ,this.add);
        app.put(    LINK.ADMIN.FANPAGE_UPDATE_BY_ID                         ,this.update);
        app.put(    LINK.ADMIN.FANPAGE_UPDATE_ACTIVE_BY_ID                  ,this.updateActive);
        app.delete( LINK.ADMIN.FANPAGE_DELETE_ID                            ,this.delete);
    },

    //get fanpage by page
    get:async function(req,res,next){
        //set default page
        if(req.query.page==undefined || req.query.page<=0 || isNaN(req.query.page)){
            req.query.page=1;
        }

        var condition={
            limit       :config.limitFanpage,
            offset      :config.limitFanpage*(req.query.page-1),
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
            TotalPage:Math.ceil(1.0*count[0].count/config.limitFanpage)
        })

    },

    //get list fanpage by UserID and status
    getByStatusAndUserID:async function(req,res,next){
        //set default page
        if(req.query.page==undefined || req.query.page<=0 || isNaN(req.query.page)){
            req.query.page=1;
        }

        var condition={
            user_id                 : req.params.user_id,
            status                  : req.params.status,
            limit                   : config.limitFanpage,
            offset                  : config.limitFanpage*(req.query.page-1)
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
            TotalPage:Math.ceil(1.0*count[0].count/config.limitFanpage)
        })

    },

    //get list fanpage by condition(status,name,payment_due_date,page)
    getByCondition:async function(req,res,next){
        //set default page
        if(req.query.page==undefined || req.query.page<=0 || isNaN(req.query.page)){
            req.query.page=1;
        }

        var condition={
            payment_due_date_start  : req.query.payment_due_date_start,
            payment_due_date_end    : req.query.payment_due_date_end,
            name                    : req.query.name,
            limit                   : config.limitFanpage,
            offset                  : config.limitFanpage*(req.query.page-1),
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
            TotalPage:Math.ceil(1.0*count[0].count/config.limitFanpage)
        })

    },

    //get one by condition fanpage id (uuid)
    getOneByFanpageID:async function(req,res,next){
        var condition={
            fanpage_id:req.params.fanpage_id
        };
        
        try{
            //get result in DB
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
        
        //valide fanpage_id không null, undefined hoặc rỗng
        if(!value.fanpage_id){
            //fanpage_id khong hợp lệ
            return res.status(400).json({
                code:40,
                mess:"fanpage_id không hợp lệ."
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
            //thong tin khong hợp lệ
            return res.status(400).json({
                code:40,
                mess:validationResult
            });

        } 

        try{
            //check fanpage id in DB
            var dataFanpage = await fanpageModel.getOne({fanpage_id:value.fanpage_id});

            if(dataFanpage.length>0){
                return res.status(400).json({
                    code:41,
                    mess:`Them khong thanh cong. fanpage ${value.fanpage_id} had exist`
                });
            }

            //check user_id exist in DB
            var dataUser = await userModel.getOne({user_id:value.user_id});

            if(dataUser.length==0){
                return res.status(400).json({
                    code:42,
                    mess:`Them khong thanh cong. user ${value.user_id} not exist`
                });
            }

            //insert to DB
            var result=await fanpageModel.add(value);

        }catch(e){
            console.log(e);
            return res.status(500).json({
                    code:50,
                    mess:"server error "
                });
        }

        if(result.affectedRows==0){
            return res.status(400).json({
                    code:43,
                    message:"Them khong thanh cong"
                })
        }
        return  res.status(200).json({
                    status:20,
                    message:"Them thanh cong"
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

        //validate input value
        var validationResult=validateFanpageInput(value);
    
        if ( validationResult !== true) {
            //thong tin khong hợp lệ
            return res.status(400).json({
                code:40,
                mess:validationResult
            });

        } 

        try{

            //check user_id exist in DB
            var dataUser = await userModel.getOne({user_id:value.user_id});

             if(dataUser.length==0){
                 return res.status(400).json({
                     code:41,
                     mess:`user ${value.user_id} not exist`
                 });
            }

            //update to Db
            var result=await fanpageModel.update(condition,value);
        }catch(e){
            console.log(e);
            return res.status(500).json({
                    code:50,
                    mess:"server error "
                });
        }
        if(result.affectedRows==0){
            return res.status(400).json({
                    code:42,
                    message:`update ${condition.fanpage_id} khong thanh cong`
                })
        }
        return  res.status(200).json({
                    status:20,
                    message:`update ${condition.fanpage_id} thanh cong`
                })
        
    },



    //update active by fanpage id
    updateActive:async function(req,res,next){
        var condition={
            fanpage_id         :req.params.fanpage_id
        }
        var value={
            active       :req.body.active,       //role type need update
        };


        if (typeof value.active !== 'boolean') {
            // active không phải là kiểu boolean
            return res.status(400).json({
                code:41,
                mess:"active must be boolean"
            });
        }

        try{
            //update to Db
            var result=await fanpageModel.update(condition,value);
        }catch(e){
            console.log(e);
            return res.status(500).json({
                    code:50,
                    mess:"server error "
                });
        }

        if(result.affectedRows==0){
            return res.status(400).json({
                    code:42,
                    message:`update active of ${condition.fanpage_id} khong thanh cong`
                })
        }
        return  res.status(200).json({
                    status:20,
                    message:`update active of ${condition.fanpage_id} thanh cong`
                })
    },



    //delete fanpage by fanpage_id (change status to 0 and active is false) 
    delete: async function(req,res,next){
        //condition fanpage_id
        var condition={
            fanpage_id         :req.params.fanpage_id
        }
        var value={
            active       : false,
            status       : 0,       // 0 is deteted
        };

        try{
            //update to Db
            var result=await fanpageModel.update(condition,value);
        }catch(e){
            console.log(e);
            return res.status(500).json({
                    code:50,
                    mess:"server error "
                });
        }

        if(result.affectedRows==0){
            return res.status(400).json({
                    code:41,
                    message:`delete ${condition.fanpage_id} not success`
                })
        }
        return  res.status(200).json({
                    status:20,
                    message:`delete ${condition.fanpage_id} success`
                })

    }

}
