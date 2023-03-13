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
        var result;
        result  = db.load(`select count(*) as count from ${TABLE} `);
        return result;
    },
    
    //get details fanpage ID
    getOne:function(condition){
        return db.getOneByCondition(TABLE,condition);
    },

    //get list fanpage by user id
    getListByUserId: function(condition){
        var result  = db.load(`select * from ${TABLE} where ?`,condition);
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

    //get fanpage by condition active,payment_due_date start -> end,name 
    getFanpagesByCondition: function(condition){             
        const sql = `SELECT * FROM ${TABLE} WHERE active = ? AND payment_due_date BETWEEN ? AND ? AND name LIKE ?`;
        const values = [
          condition.active,
          condition.payment_due_date_start,
          condition.payment_due_date_end,
          `%${condition.name}%` 
        ];
        var result  = db.load(sql,values);
        return result;
    },
    
}