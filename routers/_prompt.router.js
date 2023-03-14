const promptModel = require("../models/prompt.model");
const fanpageModel= require("../models/fanpage.model");
const LINK = require("../util/links.json");
const config    =require("../config/default.json");
const { v4: uuidv4, validate: validateUuid } = require("uuid");

module.exports = {
    promptRouters:function(app){
        app.get(    LINK.CLIENT.PROMPT_GET_BY_FANPAGE_ID             ,this.getByFanpageID);
        app.get(    LINK.CLIENT.PROMPT_GET_BY_ID                     ,this.getByID);
        app.post(   LINK.CLIENT.PROMPT_ADD_NEW                       ,this.add);
        app.put(    LINK.CLIENT.PROMPT_UPDATE_CONTENT_BY_ID          ,this.updateContent);
        app.put(    LINK.CLIENT.PROMPT_UPDATE_ACTIVE_BY_ID           ,this.updateActive);
        app.delete( LINK.CLIENT.PROMPT_DELETE_BY_ID                  ,this.delete);
    },
    //get prompt by fanpage id
    getByFanpageID:async function(req,res,next){
        //set default page
        if(req.query.page==undefined || req.query.page<=0 || isNaN(req.query.page)){
            req.query.page=1;
        }

        var condition={
            fanpage_id  :req.params.fanpage_id,
            limit       :config.limitPrompt,
            offset      :config.limitPrompt*(req.query.page-1),
        };

        try{
            var [count,result]=await Promise.all([
                promptModel.countPromptByFanpageID(condition),
                promptModel.getPromptByFanpageID(condition)
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
            TotalPage:Math.ceil(1.0*count[0].count/config.limitPrompt)
        })

    },

    //get details prompt by id
    getByID:async function(req,res,next){
        var condition={
            prompt_id   :req.params.prompt_id
        };
        
        //UUID validate
        if(validateUuid(condition.prompt_id) !== true){
            return  res.status(400).json({
                        code:40,
                        message: "Invalid prompt id(UUID) format",
                    });
        }

        try{
            //get result in DB
            var result= await promptModel.getOne(condition);

        }catch(e){
            console.log(e);
            return res.status(500).send("server error ");
        }

        return res.status(200).json({
            code:20,
            data:result
        })
    },

    //add new prompt
    add:async function(req,res,next){

        var value={
            prompt_id           :uuidv4(),           
            active              :false,   //default is false
            content             :req.body.content,           
            create_date         :req.body.create_date,         
            modified_date       :req.body.modified_date,         
            fanpage_id          :req.body.fanpage_id          
        };
        

        try{
            //check fanpage id in DB
            var dataFanpage = await fanpageModel.getOne({fanpage_id:value.fanpage_id});

            if(dataFanpage.length == 0){
                return res.status(400).json({
                    code:41,
                    mess:`fanpage ${value.fanpage_id} not exist`
                });
            }

            //insert to Db
            var result=await promptModel.add(value);
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
                    message:"Them khong thanh cong"
                })
        }
        return  res.status(200).json({
                    status:20,
                    message:"Them thanh cong"
                })
        
    },

    //update content prompt by ID 
    updateContent:async function(req,res,next){
        //condition prompt_id
        var condition={
            prompt_id           :req.params.prompt_id
        }

        var value={
            content             :req.body.content,
            modified_date       :req.body.modified_date
        };

        try{
            //update to Db
            var result=await promptModel.update(condition,value);
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
                    message:`update content of ${condition.prompt_id} khong thanh cong`
                })
        }
        return  res.status(200).json({
                    status:20,
                    message:`update content of ${condition.prompt_id} thanh cong`
                })
    },

    //update active prompt by ID 
    updateActive:async function(req,res,next){
        //condition prompt_id
        var condition={
            prompt_id         :req.params.prompt_id
        }

        var value={
            fanpage_id      :req.body.fanpage_id,
            active          :req.body.active,
            modified_date   :req.body.modified_date
        };

        if (typeof value.active !== 'boolean') {
            // active không phải là kiểu boolean
            return res.status(400).json({
                code:41,
                mess:"active must be boolean"
            });
        }

        try{

            if(value.active === true){
                //check prompt active by fanpage id
                var dataPromptActived = await promptModel.getPromptActivedByFanpageID(value);
                //Exist prompt actived before.
                if(dataPromptActived.length > 0){
                    return res.status(400).json({
                        code:41,
                        mess:`Exist other prompt actived in fanpage ${value.fanpage_id}.`
                    });
                }
            }
            
            //update to Db
            var result=await promptModel.update(condition,value);
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
                    message:`update active of ${condition.prompt_id} khong thanh cong`
                })
        }
        return  res.status(200).json({
                    status:20,
                    message:`update active of ${condition.prompt_id} thanh cong`
                })
    },

    //delete prompt by id
    delete: async function(req,res,next){
        var condition={
            prompt_id         :req.params.prompt_id
        }

        //UUID validate
        if(validateUuid(condition.prompt_id) !== true){
            return  res.status(400).json({
                        code:40,
                        message: "Invalid prompt_id(UUID) format",
                    });
        }

        try{
            var result=await promptModel.delete(condition);
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
                    message:`delete prompt ${condition.prompt_id} not success`
                })
        }
        return  res.status(200).json({
                    status:20,
                    message:`delete prompt ${condition.prompt_id}  success`
                })
    }

    
}