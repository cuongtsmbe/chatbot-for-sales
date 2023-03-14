const db = require('../util/db');
const TABLE="User";

module.exports={
    //get list user in DB by page
    getList: function(condition){
        var result   = db.get(TABLE,condition.limit,condition.offset);
        return result;
    },

    //get list user by status (0:deleted,1:normal,2:admin block,3:get all status) in DB by page
    getListByStatusAndPhone: function(condition){
        var result;
        if(condition.status == 3){
            result  = db.load(`select * from ${TABLE} where phone_number LIKE ? limit ? offset ?`,
            [condition.phone_number,condition.limit,condition.offset]);
        }else{
            result  = db.load(`select * from ${TABLE} where status = ? and phone_number LIKE ? limit ? offset ?`,
            [condition.status,condition.phone_number,condition.limit,condition.offset]);
        }

        return result;
    },


    //count all user
    countAll:function(){
        var result;
        result  = db.load(`select count(*) as count from ${TABLE} `);
        return result;
    },

    //count list user by status (0:deleted,1:normal,2:admin block,3:get all status) in DB by page
    countListByStatusAndPhone: function(condition){
        var result;
        if(condition.status == 3){
            result  = db.load(`select count(*) as count from ${TABLE} where phone_number LIKE ? `,
            [condition.phone_number]);
        }else{
            result  = db.load(`select count(*) as count from ${TABLE} where status = ? and phone_number LIKE ?`,
            [condition.status,condition.phone_number]);
        }

        return result;
    },
        

    //get details user(saler) by ID
    getOne:function(condition){
        return db.getOneByCondition(TABLE,condition);
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