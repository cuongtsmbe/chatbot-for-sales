const buyerModel = require("../models/buyer.model");
const LINK = require("../util/links.json");
const config    =require("../config/default.json");
const { validate: validateUuid } = require("uuid");

module.exports = {
    buyerRouters:function(app){
        app.get(    LINK.CLIENT.BUYER_GET_BY_FANPAGE_ID                     ,this.getByFanpageID);
        app.get(    LINK.CLIENT.BUYER_GET_BY_ACTIVE_AND_FANPAGE_ID          ,this.getByActiveAndFanpageID);
        app.put(    LINK.CLIENT.BUYER_UPDATE_ACTIVE_BY_ID                   ,this.updateActiveByID);
    },

    //get buyer by FANPAGE_ID and page
    getByFanpageID:async function(req,res,next){
        //set default page
        if(isNaN(req.query.page) || req.query.page<=0){
            req.query.page=1;
        }

        var condition={
            fanpage_id      :req.params.fanpage_id,
            limit           :config.limitBuyer,
            offset          :config.limitBuyer*(req.query.page-1),
        };

        try{
            var [count,result]=await Promise.all([
                buyerModel.countBuyerByFanpageID(condition),
                buyerModel.getBuyerByFanpageID(condition)
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
            TotalPage:Math.ceil(1.0*count[0].count/config.limitBuyer)
        })

    },
    
    //get buyer by ACTIVE,FANPAGE_ID and page
    getByActiveAndFanpageID:async function(req,res,next){
        //set default page
        if(isNaN(req.query.page) || req.query.page<=0){
            req.query.page=1;
        }

        var condition={
            fanpage_id      :req.params.fanpage_id,
            active          :req.params.active,
            limit           :config.limitBuyer,
            offset          :config.limitBuyer*(req.query.page-1),
        };

        try{
            var [count,result]=await Promise.all([
                buyerModel.countBuyerByActiveAndFanpageID(condition),
                buyerModel.getBuyerByActiveAndFanpageID(condition)
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
            TotalPage:Math.ceil(1.0*count[0].count/config.limitBuyer)
        })

    },

    //update active by buyer id 
    updateActiveByID:async function(req,res,next){
        //condition buyer_id
        var condition={
            buyer_id        :req.params.buyer_id
        }

        var value={     
            active          :req.body.active
        };

        //UUID validate
        if(validateUuid(condition.buyer_id) !== true){
        return  res.status(400).json({
                    code:40,
                    message: "Invalid ID(UUID) format",
                });
        }

        if (typeof value.active !== 'boolean') {
            // active không phải là kiểu boolean
            return res.status(400).json({
                code:41,
                message:"active must be boolean"
            });
        }

        try{
            //update to Db
            var result=await buyerModel.update(condition,value);
        }catch(e){
            console.log(e);
            return res.status(500).json({
                    code:50,
                    message:"server error "
                });
        }
        if(result.affectedRows==0){
            return res.status(400).json({
                    code:42,
                    message:`update ${condition.buyer_id} khong thanh cong`
                })
        }
        return  res.status(200).json({
                    status:20,
                    message:`update ${condition.buyer_id} thanh cong`
                })

    }
}