const userModel = require("../models/user.model");
const LINK = require("../util/links.json");
const config    =require("../config/default.json");
const { v4: uuidv4, validate: validateUuid } = require("uuid");
const {validateRoleInput}    = require('../util/validation');
const crypto=require('crypto');

module.exports = {
    userRouters:function(app){
        app.get(    LINK.ADMIN.USER_GET_ALL                                 ,this.get);
        app.get(    LINK.ADMIN.USER_GET_BY_STATUS_AND_PHONE                 ,this.getByStatusAndPhone);
        app.get(    LINK.ADMIN.USER_GET_DETAILS_BY_USER_ID                  ,this.getOneByUserID);
        app.post(   LINK.ADMIN.USER_ADD_NEW                                 ,this.add);
        app.put(    LINK.ADMIN.USER_UPDATE_BY_USER_ID                       ,this.update);
        app.put(    LINK.ADMIN.USER_UPDATE_ROLE_BY_USER_ID                  ,this.updateRole);
        app.delete( LINK.ADMIN.USER_DELETE_BY_USER_ID                       ,this.delete);
    },

    //get user by page
    get:async function(req,res,next){
        //set default page
        if( isNaN(req.query.page) || req.query.page<=0){
            req.query.page=1;
        }

        var condition={
            limit       :config.limit.user,
            offset      :config.limit.user*(req.query.page-1),
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
            TotalPage:Math.ceil(1.0*count[0].count/config.limit.user)
        })

    },

    //get user by condition status(0:deleted,1:normal,2: admin block , 3 all status) and phone number
    getByStatusAndPhone:async function(req,res,next){
        if(isNaN(req.query.page) || req.query.page<=0){
            req.query.page=1;
        }

        var condition={
            status          :req.query.status,
            phone_number    :req.query.phone_number,
            limit           :config.limit.user,
            offset          :config.limit.user*(req.query.page-1),
        };

        if(!condition.status || !condition.phone_number){
            return res.status(400).json({
                code    :40,
                message :"status or phone_number is required."
            });
        }      

        try{
            condition.phone_number = `%${condition.phone_number}%`;

            var [count,result]=await Promise.all([
                    userModel.countListByStatusAndPhone(condition),
                    userModel.getListByStatusAndPhone(condition)
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
            TotalPage:Math.ceil(1.0*count[0].count/config.limit.user)
        })
    },

    //get one by condition user id (uuid)
    getOneByUserID:async function(req,res,next){
 
        var condition={
            user_id:req.params.user_id
        };
        
        try{
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
            status          :1          
        };

         if(!value.user_name || !value.phone_number || !value.address || !value.role_type || !value.email || !value.password){
            return res.status(400).json({
                code:40,
                message:"user_name,phone_number,address,role_type,email,password is required ."
            });
        }


        //role type phải khác root
        if( value.role_type === "root"){
            return res.status(400).json({
                code:40,
                message:"required role khác root."
            });
        }
 

        if(req.user.role_type !== "root"){
            //validate user(admin) input
            var validationResult=validateRoleInput(value);

            if ( validationResult !== true) {
                return res.status(400).json({
                    code:40,
                    message:validationResult
                });
            } 
        }
       

        try{
            //check user name had exist in DB
            var data = await userModel.getOne({user_name:value.user_name});

            if(data.length>0){
                return res.status(400).json({
                    code:41,
                    message:`Them khong thanh cong. ${value.user_name} had exist`
                });
            }

            //hash password and response
            crypto.pbkdf2(value.password,process.env.SALT_PASSWORD, 310000,32, 'sha256',async function(err, hashedPassword) {
                if (err) {
                    console.log(err);
                    res.status(500).json({
                        code:50,
                        message:"Server error."
                    });            
                    return false;
                }
    
                //cover to String hex 
                hashedPassword=hashedPassword.toString("hex");

                //save password hash
                value.password = hashedPassword;

                //insert to Db
                var result=await userModel.add(value);

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
            }); 

        }catch(e){
            console.log(e);
            return res.status(500).json({
                    code:50,
                    message:"server error "
                });
        }

       
        
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
            phone_number    :req.body.phone_number,           
            address         :req.body.address,         
            role_type       :req.body.role_type,         
            email           :req.body.email,        
            status          :req.body.status
        };

        //check input
        if(!value.phone_number || !value.address || !value.role_type || !value.email || !value.status){
            return res.status(400).json({
                code:40,
                message:"phone_number,address,role_type,email,status is required ."
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
            return res.status(500).json({
                    code:50,
                    message:"server error "
                });
        }

        
         //role type phải khác root
        if(value.role_type === "root"){
            //thong tin khong hợp lệ
            return res.status(400).json({
                code:40,
                message:"required role khác root."
            });
        }
 
        //nếu không phải root user thì phải validate
        if(req.user.role_type !== "root"){
            //validate user(admin) input
            var validationResult=validateRoleInput(value);

            if ( validationResult !== true) {
                //thong tin khong hợp lệ
                return res.status(400).json({
                    code:40,
                    message:validationResult
                });
            } 
        }


        try{
            
            var userResult = await userModel.getOne(condition);
            //check user exist
            if(userResult.length == 0){
                return res.status(400).json({
                    code:41,
                    message:`${value.user_id} not exist`
                });
            }

            userResult=userResult[0];

            //check is update for user root
            if(userResult.role_type === "root"){
                //can't update for root user
                return res.status(400).json({
                    code:41,
                    message:`can't update for root user.`
                });
            }


            //update to Db
            var result=await userModel.update(condition,value);
            
            if(result.length==0 || result.affectedRows==0){
                return res.status(400).json({
                        code:42,
                        message:`update ${condition.user_id} khong thanh cong`
                    })
            }
            return  res.status(200).json({
                        status:20,
                        message:`update ${condition.user_id} thanh cong`
                    })

        }catch(e){
            console.log(e);
            return res.status(500).json({
                    code:50,
                    message:"server error "
                });
        }
        
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


        //check input role 
        if(!value.role_type){
            return res.status(400).json({
                code:40,
                message:"role is required."
            });
        }

        //UUID validate
        if(validateUuid(condition.user_id) !== true){
            return  res.status(400).json({
                        code:40,
                        message: "Invalid UUID format",
                    });
        }

        //role type phải khác root
        if(value.role_type === "root"){
            //thong tin khong hợp lệ
            return res.status(400).json({
                code:40,
                message:"required role khác root."
            });
        }

        //root có thể bỏ qua validateRoleInput
        if(req.user.role_type !== "root"){
            //validate role type input 
            var validateRoleResult=validateRoleInput(value);
            
            if(validateRoleResult !== true){
                //role type khong hop le
                return res.status(400).json({
                    code:41,
                    message:validateRoleResult
                });

            }
        }

        try{

            var userResult = await userModel.getOne(condition);
            //check user exist
            if(userResult.length == 0){
                return res.status(400).json({
                    code:41,
                    message:`${value.user_id} not exist`
                });
            }

            userResult=userResult[0];

            //check is update for user root
            if(userResult.role_type === "root"){
                //can't update for root user
                return res.status(400).json({
                    code:41,
                    message:`can't update for root user.`
                });
            }

            //update to Db
            var result=await userModel.update(condition,value);

            if(result.length == 0 || result.affectedRows==0){
                return res.status(400).json({
                        code:42,
                        message:`update role ${condition.user_id} khong thanh cong`
                    })
            }
            return  res.status(200).json({
                        status:20,
                        message:`update role ${condition.user_id} thanh cong`
                    })

        }catch(e){
            console.log(e);
            return res.status(500).json({
                    code:50,
                    message:"server error "
                });
        }
    },

    //delete by user id
    delete: async function(req,res,next){
        //condition user id
        var condition={
            user_id         :req.params.user_id
        }
        var value={
            status       : 0,       //0 is deteted
        };


        if(req.user.user_id === condition.user_id){
            //không thể xóa chính mình
            return  res.status(400).json({
                code:40,
                message: `can't delete yourself.`,
            });
        }

        //UUID validate
        if(validateUuid(condition.user_id) !== true){
            return  res.status(400).json({
                        code:41,
                        message: "Invalid UUID format",
                    });
        }

        try{

            var userResult = await userModel.getOne(condition);
            //check user exist
            if(userResult.length == 0){
                return res.status(400).json({
                    code:42,
                    message:`${value.user_id} not exist`
                });
            }

            userResult=userResult[0];

            //check is delete user root
            if(userResult.role_type === "root"){
                //can't delete for root user
                return res.status(400).json({
                    code:43,
                    message:`can't delete root user.`
                });
            }


            //update to Db
            var result=await userModel.update(condition,value);

            if(result.length == 0 || result.affectedRows==0){
                return res.status(400).json({
                        code:41,
                        message:`delete ${condition.user_id} not success`
                    })
            }
            return  res.status(200).json({
                        status:20,
                        message:`delete ${condition.user_id}  success`
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
