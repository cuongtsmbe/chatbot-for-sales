const db = require('../util/db');
const TABLE="Order";

module.exports={
    //get list orders by fanpage_id
    getOrderByFanpageIDAndTime: function(condition){
        var result;
        if(condition.created_date === null){
            result   = db.load(`select * from ${TABLE} where fanpage_id = ? limit ? offset ?`,
            [condition.fanpage_id,condition.limit,condition.offset]);
        }else{
            result   = db.load(`select * from ${TABLE} where fanpage_id = ? and created_date >= ? limit ? offset ?`,
            [condition.fanpage_id,condition.created_date,condition.limit,condition.offset]);
        }
        return result;
    },

    //count order by fanpage id
    countOrderByFanpageIDAndTime: function(condition){
        var result;
        if(condition.created_date === null){
            result   = db.load(`select * from ${TABLE} where fanpage_id = ?`,
            [condition.fanpage_id]);
        }else{
            result   = db.load(`select * from ${TABLE} where fanpage_id = ? and created_date >= ?`,
            [condition.fanpage_id,condition.created_date]);
        }
        return result;
    },

    //get details order by ID
    getOne:function(condition){
        return db.getOneByCondition(TABLE,condition);
    },

    //add new order 
    add:function(value){
        return db.insert(TABLE,value);
    },

    //update order by order_id
    update:function(condition,value){
        return db.load(`UPDATE ${TABLE} SET ? WHERE ?`,[value,condition]);
    },
    
    //delete order by order_id
    delete:function(condition){
        return db.delete(TABLE,condition);
    }

}