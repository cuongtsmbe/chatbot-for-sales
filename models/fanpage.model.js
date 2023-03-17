const db = require('../util/db');
const TABLE="Fanpage";

module.exports={
  
    //get list fanpage in DB 
    getList: function(condition){
        var result   = db.get(TABLE,condition.limit,condition.offset);
        return result;
    },

    //count all fanpage
    countAll:function(){
        var result  = db.load(`select count(*) as count from ${TABLE} `);
        return result;
    },

    //count all fanpage actived in server
    countAllFanpageActived:function(){
        var result  = db.load(`select count(*) as count from ${TABLE} where active = true`);
        return result;
    },
    
    //get details fanpage ID
    getOne:function(condition){
        return db.getOneByCondition(TABLE,condition);
    },

    //get details condition user ID and fanpage ID 
    getOneByUserIDAndFanpageID:function(condition){
        var result  = db.load(`select * from ${TABLE} where user_id = ? and fanpage_id = ? `,condition);
        return result;
    },

    //get list fanpage by user id and status(0:deleted,1:normal,2:admin block,3:get all status)
    getListByStatusAndUserId: function(condition){
        var result;
        if(condition.status == 3){       
            result  = db.load(`select * from ${TABLE} where user_id = ?  limit ? offset ?`,
            [condition.user_id,condition.limit,condition.offset]);
        }else{
            result  = db.load(`select * from ${TABLE} where status = ? and user_id = ? limit ? offset ?`,
            [condition.status,condition.user_id,condition.limit,condition.offset]);
        }
        return result;
    },

    //count list fanpage by user id and status
    countListByStatusAndUserId: function(condition){
        var result;
        if(condition.status == 3){       
            result  = db.load(`select count(*) as count from ${TABLE} where user_id = ? `,
            [condition.user_id]);
        }else{
            result  = db.load(`select count(*) as count from ${TABLE} where status = ? and user_id = ? `,
            [condition.status,condition.user_id]);
        }
        return result;
    },

    //add new user 
    add:function(value){
        return db.insert(TABLE,value);
    },

    //update infomation by condition fanpage id
    update:function(condition,value){
        return db.load(`UPDATE ${TABLE} SET ? WHERE ?`,[value,condition]);
    },

    //delete user
    delete:function(condition){
        return db.delete(TABLE,condition);
    },

    //get fanpage by condition status(0:deleted,1:normal,2:admin block,3:get all status),payment_due_date start -> end,name 
    getFanpagesByCondition: function(condition){     
        var sql;
        var values=[
            condition.payment_due_date_start,
            condition.payment_due_date_end,
            `%${condition.name}%`,
            condition.limit,
            condition.offset
        ];
        if(condition.status == 3){       
            sql = `SELECT * FROM ${TABLE} WHERE payment_due_date BETWEEN ? AND ? AND name LIKE ? limit ? offset ?`;
        }else{
            sql = `SELECT * FROM ${TABLE} WHERE status = ? AND payment_due_date BETWEEN ? AND ? AND name LIKE ? limit ? offset ?`;
            //add status begin array
            values.unshift(condition.status);
        }
        var result  = db.load(sql,values);
        return result;
    },

    //count fanpage by condition status(0:deleted,1:normal,2:admin block,3:get all status),payment_due_date start -> end,name 
    countFanpagesByCondition: function(condition){             
        var sql;
        var values=[
            condition.payment_due_date_start,
            condition.payment_due_date_end,
            `%${condition.name}%`,
        ];
        if(condition.status == 3){       
            sql = `SELECT count(*) as count FROM ${TABLE} WHERE payment_due_date BETWEEN ? AND ? AND name LIKE ?`;
        }else{
            sql = `SELECT count(*) as count FROM ${TABLE} WHERE status = ? AND payment_due_date BETWEEN ? AND ? AND name LIKE ?`;
            //add status begin array
            values.unshift(condition.status);
        }
        var result  = db.load(sql,values);
        return result;
    },
    
}