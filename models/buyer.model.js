const db = require('../util/db');
const TABLE="Buyer";

module.exports={
    //get list buyer by fanpage_id
    getBuyerByFanpageID: function(condition){
        var result   = db.load(`select * from ${TABLE} where fanpage_id = ? limit ? offset ?`,
        [condition.fanpage_id,condition.limit,condition.offset]);
        return result;
    },

    //get details by fanpage id and facebook id of buyer
    getOneByFanpageIDAndFacebookIDOfBuyer:function(condition){
        var result   = db.load(`select * from ${TABLE} where fanpage_id = ? and facebook_id = ? `,
        [condition.fanpage_id,condition.facebook_id]);
        return result;
    },

    //count buyer by fanpage id
    countBuyerByFanpageID: function(condition){
        var result   = db.load(`select count(*) as count from ${TABLE} where fanpage_id = ?`,condition.fanpage_id);
        return result;
    },

    //get list buyer by active and fanpage_id
    getBuyerByActiveAndFanpageID: function(condition){
        var result   = db.load(`select * from ${TABLE} where fanpage_id = ? and active = ? limit ? offset ?`,
        [condition.fanpage_id,condition.active,condition.limit,condition.offset]);
        return result;
    },

    //count list buyer by active and fanpage_id
    countBuyerByActiveAndFanpageID: function(condition){
        var result   = db.load(`select count(*) as count from ${TABLE} where fanpage_id = ? and active = ?`,[condition.fanpage_id,condition.active]);
        return result;
    },

    //update active buyer by fanpage id
    update:function(condition,value){
        return db.load(`UPDATE ${TABLE} SET ? WHERE ?`,[value,condition]);
    },
    
}