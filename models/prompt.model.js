const db = require('../util/db');
const TABLE="Prompt";

module.exports={
    //get list prompt by fanpage_id
    getPromptByFanpageID: function(condition){
        var result   = db.load(`select * from ${TABLE} where fanpage_id = ? limit ? offset ?`,
            [condition.fanpage_id,condition.limit,condition.offset]);
        return result;
    },

    //count prompt by fanpage id
    countPromptByFanpageID: function(condition){
        var result   = db.load(`select count(*) as count from ${TABLE} where fanpage_id = ? `,
        [condition.fanpage_id]);
        return result;
    },

    //get prompt actived by fanpage id
    getPromptActivedByFanpageID:function(condition){
        var result   = db.load(`select * from ${TABLE} where fanpage_id = ? and active = ? `,
        [condition.fanpage_id,condition.active]);
        return result;
    },

    //get details prompt by ID
    getOne:function(condition){
        return db.getOneByCondition(TABLE,condition);
    },

    //add new prompt 
    add:function(value){
        return db.insert(TABLE,value);
    },

    //update prompt by ID
    update:function(condition,value){
        return db.load(`UPDATE ${TABLE} SET ? WHERE ?`,[value,condition]);
    },
    
    //delete prompt by ID
    delete:function(condition){
        return db.delete(TABLE,condition);
    }

}