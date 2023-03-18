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

        let createdDate = new Date(); // Lấy thời gian hiện tại cho created_date
        let modifiedDate = new Date(); // Lấy thời gian hiện tại cho modified_date

        let createdDatetime = createdDate.toISOString().slice(0, 19).replace('T', ' ');
        let modifiedDatetime = modifiedDate.toISOString().slice(0, 19).replace('T', ' ');

 
        var value={
            prompt_id           :uuidv4(),           
            active              :false,   //default is false
            content             :req.body.content,           
            created_date        :createdDatetime ,         
            modified_date       :modifiedDatetime,         
            fanpage_id          :req.params.fanpage_id          
        };


        if(!value.content){
            //content is empty or undefined,null
            return res.status(400).json({
                code:40,
                message:`content is required.`
            });
        }

        try{
            //check fanpage id in DB
            var dataFanpage = await fanpageModel.getOne({fanpage_id:value.fanpage_id});

            if(dataFanpage.length == 0){
                return res.status(400).json({
                    code:41,
                    message:`fanpage ${value.fanpage_id} not exist`
                });
            }

            //insert to Db
            var result=await promptModel.add(value);

            if(result.length==0 || result.affectedRows==0){
                return res.status(400).json({
                        code:42,
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

    //update content prompt by ID 
    updateContent:async function(req,res,next){
        //condition prompt_id
        var condition={
            prompt_id           :req.params.prompt_id
        }

        // Lấy thời gian hiện tại cho modified_date
        let modifiedDate = new Date(); 
        // Định dạng chuỗi datetime cho MySQL
        // Cắt để loại bỏ phần giây thừa và thay thế ký tự "T" bằng dấu cách để đáp ứng định dạng datetime của MySQL
        let modifiedDatetime = modifiedDate.toISOString().slice(0, 19).replace('T', ' ');

        var value={
            content             :req.body.content,
            modified_date       :modifiedDatetime
        };

        if(!value.content){
             //content is empty or undefined,null
             return res.status(400).json({
                code:40,
                message:`content is required.`
            });
        }

        try{
            //update to Db
            var result=await promptModel.update(condition,value);

            if(result.length == 0 || result.affectedRows==0){
                return res.status(400).json({
                        code:42,
                        message:`update content of ${condition.prompt_id} khong thanh cong`
                    })
            }
            return  res.status(200).json({
                        status:20,
                        message:`update content of ${condition.prompt_id} thanh cong`
                    })

        }catch(e){
            console.log(e);
            return res.status(500).json({
                    code:50,
                    message:"server error "
                });
        }

       
    },

    //update active prompt by ID 
    updateActive:async function(req,res,next){
        //condition prompt_id
        var condition={
            prompt_id         :req.params.prompt_id
        }
          
        let modifiedDate = new Date(); 
        let modifiedDatetime = modifiedDate.toISOString().slice(0, 19).replace('T', ' ');
   

        var value={
            fanpage_id      :req.body.fanpage_id,
            active          :req.body.active,
            modified_date   :modifiedDatetime
        };


        if(!value.fanpage_id){
            //check input fanpage id
                return res.status(400).json({
                    code:41,
                    message:"fanpage id is required."
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

            //check fanpage id in DB
            var dataFanpage = await fanpageModel.getOne({fanpage_id:value.fanpage_id});

            if(dataFanpage.length == 0){
                return res.status(400).json({
                    code:41,
                    message:`fanpage ${value.fanpage_id} not exist`
                });
            }
            
            if(value.active === true){
                //check prompt active by fanpage id
                var dataPromptActived = await promptModel.getPromptActivedByFanpageID(value);
                //Exist prompt actived before.
                if(dataPromptActived.length > 0){
                    //current prompt different prompt actived 
                    if(condition.prompt_id !== dataPromptActived[0].prompt_id){
                        return res.status(400).json({
                            code:41,
                            message:`Exist other prompt actived in fanpage ${value.fanpage_id}.`
                        });
                    }else{
                        return res.status(200).json({
                            code:20,
                            message:`had actived this prompt for fanpage ${value.fanpage_id}.`
                        });
                    }
                }
            }
            
            //update to Db
            var result=await promptModel.update(condition,value);

            if(result.length==0 || result.affectedRows==0){
                return res.status(400).json({
                        code:42,
                        message:`update active of ${condition.prompt_id} khong thanh cong`
                    })
            }
            return  res.status(200).json({
                        status:20,
                        message:`update active of ${condition.prompt_id} thanh cong`
                    })
        }catch(e){
            console.log(e);
            return res.status(500).json({
                    code:50,
                    message:"server error "
                });
        }

      
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

            if(result.length==0 || result.affectedRows==0){
                return res.status(400).json({
                        code:41,
                        message:`delete prompt ${condition.prompt_id} not success`
                    })
            }
            return  res.status(200).json({
                        status:20,
                        message:`delete prompt ${condition.prompt_id}  success`
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