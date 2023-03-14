const limit_fanpageModel = require("../models/limit_fanpage.model");
const LINK = require("../util/links.json");
const { v4: uuidv4 } = require("uuid");

module.exports = {
    limitFanpageRouters:function(app){
        app.get(        LINK.ADMIN.LIMIT_FANPAGE_GET_ALL                        ,this.get);
        app.post(       LINK.ADMIN.LIMIT_FANPAGE_ADD_NEW                        ,this.add);
        app.put(        LINK.ADMIN.LIMIT_FANPAGE_UPDATE_BY_ID                   ,this.update);
        app.delete(     LINK.ADMIN.LIMIT_FANPAGE_DELETE_BY_ID                   ,this.delete);
    },

    //get all record in DB (here just have one record)
    get:async function(req,res,next){

        try{
            var result=await limit_fanpageModel.getAll();
                   
        }catch(e){
            console.log(e);
            return res.status(500).send("server error ");
        }

        return res.status(200).json({
            code:20,
            data:result,
        })
        
    },

    //add new record
    add:async function(req,res,next){
        var value={
            limit_fanpage_id        :uuidv4(),           
            count                   :req.body.count,             
            description             :req.body.description,           
            
        };
        
        if (typeof value.count !== "number") {
            // count không phải là kiểu number
            return res.status(400).json({
                code:41,
                mess:"count must be number"
            });
        }

        try{
            //check exist record in DB
            var data = await limit_fanpageModel.getAll();

            if(data.length>0){
                return res.status(400).json({
                    code:41,
                    mess:`Them khong thanh cong.DB contains only 1 row of data.`
                });
            }

            //insert to Db
            var result=await limit_fanpageModel.add(value);
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

    //update record
    update:async function(req,res,next){
        var condition = {
            limit_fanpage_id        :req.params.limit_fanpage_id,
        };

        var value={  
            count                   :req.body.count,             
            description             :req.body.description,           
        };
        
        if (typeof value.count !== "number") {
            // count không phải là kiểu number
            return res.status(400).json({
                code:41,
                mess:"count must be number"
            });
        }

        try{
            //update to Db
            var result=await limit_fanpageModel.update(condition,value);
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
                    message:"update khong thanh cong"
                })
        }
        return  res.status(200).json({
                    status:20,
                    message:"update thanh cong"
                })
    },

    //delete record by id
    delete: async function(req,res,next){
        //condition user id
        var condition={
            limit_fanpage_id         :req.params.limit_fanpage_id
        }

        //UUID validate
        if(validateUuid(condition.limit_fanpage_id) !== true){
            return  res.status(400).json({
                        code:40,
                        message: "Invalid limit_fanpage_id(UUID) format",
                    });
        }

        try{
            var result=await limit_fanpageModel.delete(condition);
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
                    message:`delete ${condition.limit_fanpage_id} not success`
                })
        }
        return  res.status(200).json({
                    status:20,
                    message:`delete ${condition.limit_fanpage_id} success`
                })
    }
    
}