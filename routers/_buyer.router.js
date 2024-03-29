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
        if(isNaN(req.query.page) || req.query.page<=0){
            req.query.page=1;
        }

        var condition={
            fanpage_id      :req.params.fanpage_id,
            limit           :config.limit.buyer,
            offset          :config.limit.buyer*(req.query.page-1),
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
            TotalPage:Math.ceil(1.0*count[0].count/config.limit.buyer)
        })

    },
    
    //get buyer by ACTIVE,FANPAGE_ID and page
    getByActiveAndFanpageID:async function(req,res,next){
        if(isNaN(req.query.page) || req.query.page<=0){
            req.query.page=1;
        }

        var condition={
            fanpage_id      :req.params.fanpage_id,
            active          :req.params.active,
            limit           :config.limit.buyer,
            offset          :config.limit.buyer*(req.query.page-1),
        };

        if (String(condition.active).toLowerCase() != "true" && String(condition.active).toLowerCase() != "false") {
            return res.status(400).json({
                code:41,
                message:"active must be boolean"
            });
        }
            
        try{
            //cover string "true" or "false" to boolean
            condition.active = JSON.parse(String(condition.active).toLowerCase());

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
            TotalPage:Math.ceil(1.0*count[0].count/config.limit.buyer)
        })

    },

    //update active by buyer id 
    updateActiveByID:async function(req,res,next){
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

        if (String(value.active).toLowerCase() != "true" && String(value.active).toLowerCase() != "false") {
            return res.status(400).json({
                code:41,
                message:"active must be boolean."
            });
        }

        try{
            //cover string "true" or "false" to boolean
            value.active = JSON.parse(String(value.active).toLowerCase());

            var result=await buyerModel.update(condition,value);

            if(result.length==0 || result.affectedRows==0){
                return res.status(400).json({
                        code:42,
                        message:`update ${condition.buyer_id} khong thanh cong`
                    })
            }
            return  res.status(200).json({
                        status:20,
                        message:`update ${condition.buyer_id} thanh cong`
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