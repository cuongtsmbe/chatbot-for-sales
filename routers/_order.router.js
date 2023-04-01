const orderModel = require("../models/order.model");
const fanpageModel = require("../models/fanpage.model");
const LINK = require("../util/links.json");
const config    =require("../config/default.json");
const {isValidMySQLDatetime}    =require("../util/validation");
const { v4: uuidv4, validate: validateUuid } = require("uuid");


module.exports = {
    orderRouters:function(app){
        app.get(    LINK.CLIENT.ORDER_GET_BY_FANPAGE_ID_AND_TIME             ,this.getByFanpageIDAndTime);
        app.get(    LINK.CLIENT.ORDER_GET_DETAILS_BY_ID                      ,this.getOneByOrderID);
        app.post(   LINK.CLIENT.ORDER_ADD_NEW                                ,this.add);
        app.put(    LINK.CLIENT.ORDER_UPDATE_CONTENT_BY_ID                   ,this.updateContent);
        app.delete( LINK.CLIENT.ORDER_DELETE_BY_ID                           ,this.delete);
    },
   
    //get order by fanpage id, time and page 
    getByFanpageIDAndTime:async function(req,res,next){
        if(isNaN(req.query.page) || req.query.page<=0){
            req.query.page=1;
        }

        var condition={
            fanpage_id      : req.params.fanpage_id,
            created_date    : req.query.created_date,
            limit           : config.limitOrder,
            offset          : config.limitOrder*(req.query.page-1),
        };

        if(!condition.created_date){
            condition.created_date = null;
        }

        try{
            var [count,result]=await Promise.all([
                    orderModel.countOrderByFanpageIDAndTime(condition),
                    orderModel.getOrderByFanpageIDAndTime(condition)
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
            TotalPage:Math.ceil(1.0*count[0].count/config.limitOrder)
        })

    },

    //get details order by order ID
    getOneByOrderID:async function(req,res,next){

        var condition={
            order_id        :req.params.order_id
        };
        
        try{
            var result= await orderModel.getOne(condition);

        }catch(e){
            console.log(e);
            return res.status(500).send("server error ");
        }

        return res.status(200).json({
            code:20,
            data:result
        })

    },

    //add new order
    add:async function(req,res,next){

        let modifiedDate = new Date(); 
        let modifiedDatetime = modifiedDate.toISOString().slice(0, 19).replace('T', ' ');


        var value={
            order_id            : uuidv4(),           
            fanpage_id          : req.body.fanpage_id,
            buyer_id            : req.body.buyer_id,
            content             : req.body.content,
            created_date        : req.body.created_date,
            modified_date       : modifiedDatetime,
            status              : 1
        };

        var condition = {
            user_id     :req.user.user_id,
            fanpage_id  :value.fanpage_id
        }

        if(!value.created_date){
            value.created_date=modifiedDatetime;
        }else{
            if(!isValidMySQLDatetime(value.created_date)){
                return res.status(400).json({
                    code:40,
                    message:`create_time is required format datetime.`
                });
            }
        }

        //check value input
        if(!value.fanpage_id || !value.buyer_id || !value.content ){
            return res.status(400).json({
                code:40,
                message:`fanpage_id,buyer_id,content is required.`
            });
        }


        try{

            //check fanpage id in DB
            var dataFanpage = await fanpageModel.getOneByUserIDAndFanpageID(condition);

            if(dataFanpage.length == 0){
                return res.status(400).json({
                    code:41,
                    message:`fanpage ${value.fanpage_id} not exist`
                });
            }

            var result=await orderModel.add(value);

            if(result.length==0 || result.affectedRows==0){
                return res.status(400).json({
                        code:43,
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

    //update content by id
    updateContent:async function(req,res,next){
         
        var condition={
            order_id         :req.params.order_id
        }

        let modifiedDate = new Date(); 
        let modifiedDatetime = modifiedDate.toISOString().slice(0, 19).replace('T', ' ');

        var value={
            content             : req.body.content,   
            modified_date       : modifiedDatetime,
            status              : req.body.status   
        };

        try{ 
            if(isNaN(value.status) || parseInt(value.status)<0){
                return res.status(400).json({
                        code:40,
                        message:"status require is number > 0"
                    });
            }
        }catch(e){
            return res.status(400).json({
                    code:40,
                    message:"status require is number > 0"
                });
        }

        //UUID validate
        if(validateUuid(condition.order_id) !== true){
            return  res.status(400).json({
                        code:40,
                        message: "Invalid order_id(UUID) format",
                    });
        }

        if(!value.content){
            return res.status(400).json({
                code:40,
                message:`content is required.`
            });
        }

        try{
            var result=await orderModel.update(condition,value);

            if(result.length==0 || result.affectedRows==0){
                return res.status(400).json({
                        code:42,
                        message:`update data for order ${condition.order_id} khong thanh cong`
                    })
            }
            return  res.status(200).json({
                        status:20,
                        message:`update data for order ${condition.order_id} thanh cong`
                    })

        }catch(e){
            console.log(e);
            return res.status(500).json({
                    code:50,
                    message:"server error "
                });
        }

       
    },

    //delete order by id
    delete: async function(req,res,next){
        var condition={
            order_id         :req.params.order_id
        }

        //UUID validate
        if(validateUuid(condition.order_id) !== true){
            return  res.status(400).json({
                        code:40,
                        message: "Invalid order_id(UUID) format",
                    });
        }

        try{
            var result=await orderModel.delete(condition);

            if(result.length==0 || result.affectedRows==0){
                return res.status(400).json({
                        code:41,
                        message:`delete order ${condition.order_id} not success`
                    })
            }
            return  res.status(200).json({
                        status:20,
                        message:`delete order ${condition.order_id} success`
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