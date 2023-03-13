const userModel = require("../models/user.model");
const LINK = require("../util/links.json");
const config    =require("../config/default.json");
const { v4: uuidv4, validate: validateUuid } = require("uuid");
const {validateUserInput,validateRoleInput}    = require('../util/validation');

module.exports = {
    userRouters:function(app){
        app.get(    LINK.ADMIN.USER_GET_ALL                                 ,this.get);
        app.get(    LINK.ADMIN.USER_GET_DETAILS_BY_USER_ID                  ,this.getOneByUserID);
        app.post(   LINK.ADMIN.USER_ADD_NEW                                 ,this.add);
        app.put(    LINK.ADMIN.USER_UPDATE_BY_USER_ID                       ,this.update);
        app.put(    LINK.ADMIN.USER_UPDATE_ROLE_BY_USER_ID                  ,this.updateRole);
        app.delete( LINK.ADMIN.USER_DELETE_BY_USER_ID                       ,this.delete);
    },

    //get user by page
    get:async function(req,res,next){
        //set default page
        if(req.query.page==undefined || req.query.page<=0 || isNaN(req.query.page)){
            req.query.page=1;
        }

        var condition={
            limit:config.limitUser,
            offset:config.limitUser*(req.query.page-1),
        };

        try{
            var [count,result]=await Promise.all([
                    userModel.countAll(),
                    userModel.getList(condition)
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
            TotalPage:Math.ceil(1.0*count[0].count/config.limitUser)
        })

    },

    //get one by condition user id (uuid)
    getOneByUserID:async function(req,res,next){
 
        var condition={
            user_id:req.params.user_id
        };
        
        try{
            //get result in DB
            var result= await userModel.getOne(condition);

        }catch(e){
            console.log(e);
            return res.status(500).send("server error ");
        }

        return res.status(200).json({
            code:20,
            data:result
        })
    },

    //add new user
    add:async function(req,res,next){

        var value={
            user_id         :uuidv4(),           
            user_name       :req.body.user_name,             
            phone_number    :req.body.phone_number,           
            address         :req.body.address,         
            role_type       :req.body.role_type,         
            email           :req.body.email,        
            password        :req.body.password,          
        };
        
        //validate user input
        var validationResult=validateUserInput(value);
    
        if ( validationResult !== true) {
            //thong tin khong hợp lệ
            return res.status(400).json({
                code:40,
                mess:validationResult
            });

        } 

        try{
            //check user name had exist in DB
            var data = await userModel.getOne({user_name:value.user_name});

            if(data.length>0){
                return res.status(400).json({
                    code:41,
                    mess:`Them khong thanh cong. ${value.user_name} had exist`
                });
            }

            //insert to Db
            var result=await userModel.add(value);
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

    //update user value by user_id
    update:async function(req,res,next){
        //condition user_id
        var condition={
            user_id     :req.params.user_id
        }

        //UUID validate
        if(validateUuid(condition.user_id) !== true){
            return  res.status(400).json({
                        code:40,
                        message: "Invalid UUID format",
                    });
        }

        var value={     
            user_name       :req.body.user_name,             
            phone_number    :req.body.phone_number,           
            address         :req.body.address,         
            role_type       :req.body.role_type,         
            email           :req.body.email,        
            password        :req.body.password,          
        };

        //validate user input
        var validationResult=validateUserInput(value);
      
        if ( validationResult !== true) {
            //thong tin khong hợp lệ
            return res.status(400).json({
                code:41,
                mess:validationResult
            });

        } 

        try{
            //update to Db
            var result=await userModel.update(condition,value);
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
                    message:`update ${condition.user_id} khong thanh cong`
                })
        }
        return  res.status(200).json({
                    status:20,
                    message:`update ${condition.user_id} thanh cong`
                })
        
    },



    //update role by user id
    updateRole:async function(req,res,next){
        //condition user id
        var condition={
            user_id         :req.params.user_id
        }
        var value={
            role_type       :req.body.role_type,       //role type need update
        };

        //UUID validate
        if(validateUuid(condition.user_id) !== true){
            return  res.status(400).json({
                        code:40,
                        message: "Invalid UUID format",
                    });
        }

        //validate role type input 
        var validateRoleResult=validateRoleInput(value);
        
        if(validateRoleResult !== true){
            //role type khong hop le
            return res.status(400).json({
                code:41,
                mess:validateRoleResult
            });

        }

        try{
            //update to Db
            var result=await userModel.update(condition,value);
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
                    message:`update role ${condition.user_id} khong thanh cong`
                })
        }
        return  res.status(200).json({
                    status:20,
                    message:`update role ${condition.user_id} thanh cong`
                })
    },

    //delete by user id (just change role type to "viewer")
    delete: async function(req,res,next){
        //condition user id
        var condition={
            user_id         :req.params.user_id
        }
        var value={
            role_type       : "viewer",       // change role is viewer
        };

        //UUID validate
        if(validateUuid(condition.user_id) !== true){
            return  res.status(400).json({
                        code:40,
                        message: "Invalid UUID format",
                    });
        }

        try{
            //update to Db
            var result=await userModel.update(condition,value);
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
                    message:`update role ${condition.user_id} to viewer not success`
                })
        }
        return  res.status(200).json({
                    status:20,
                    message:`update role ${condition.user_id} to viewer success`
                })
    }

}
