const db = require('../util/db');
const TABLE="Limit_fanpage";

module.exports={
    //get all record (just have 1 row in DB)
    getAll: function(){
        var result   = db.load(`select * from ${TABLE} `);
        return result;
    },

    //add new 
    add:function(value){
        return db.insert(TABLE,value);
    },

    //update by ID
    update:function(condition,value){
        return db.load(`UPDATE ${TABLE} SET ? WHERE ?`,[value,condition]);
    },

    //delete by ID
    delete:function(condition){
        return db.delete(TABLE,condition);
    }
}