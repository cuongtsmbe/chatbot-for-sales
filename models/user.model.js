const db = require('../util/db');
const TABLE="User";

module.exports={
    //get list user in DB by page
    getList: function(condition){
        var result   = db.get(TABLE,condition.limit,condition.offset);
        return result;
    },

    //count all user
    countAll:function(){
        var result;
        result  = db.load(`select count(*) as count from ${TABLE} `);
        return result;
    },

    
    //get details user(saler) by ID
    getOne:function(condition){
        return db.getOneByCondition(TABLE,condition);
    },

    //search list by phone number
    searchByPhone:function(condition){
        var sql=`select * from ${TABLE} where phone_number LIKE ? `;
        return db.load(sql,condition);
    },

    //add new user 
    add:function(value){
        return db.insert(TABLE,value);
    },

    //update infomation user by condition user id
    update:function(condition,value){
        return db.load(`UPDATE ${TABLE} SET ? WHERE ?`,[value,condition]);
    },

    //delete user
    delete:function(condition){
        return db.delete(TABLE,condition);
    }
}