const db = require('../util/db');
const TABLE="Conversation";

module.exports={
    //get list coversation by fanpage_id and sender_id 
    getConversationsByFanpageAndSenderID: function(condition){
        var result   = db.load(`select * from ${TABLE} where fanpage_id = ? and sender_id = ? `,
        [condition.fanpage_id,condition.sender_id]);
        return result;
    },

    //add new coversation 
    add:function(value){
        return db.insert(TABLE,value);
    },
    
}