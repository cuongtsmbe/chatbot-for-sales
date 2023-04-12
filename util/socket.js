const {io}    = require("./../websocket/socket");
const {redis}   = require("./redis");
module.exports = {
    //send all in room include sender
    emitOrder:function(receiverRoom,data){
        io.in(receiverRoom).emit("new_order",data);
    },
    emitMessageClient:function(receiverRoom,message){
        io.in(receiverRoom).emit("message_client_send",message);
    },
    emitMessageFromFanpageSend:function(room,message){
        io.in(room).emit("message_fanpage_send",message);
    },
    //fanpage
    saveRoomByFanpageID:async function(fanpapgeID,userID){
        try{
            await redis.set(`fanpage:${fanpapgeID}`,userID);
        }catch(e){
            console.log(e);
        }
    },
    getRoomByFanpageID:async function(fanpapgeID){
        try{
            let room=await redis.get(`fanpage:${fanpapgeID}`);
            return room;
        }catch(e){
            console.log(e);
            return null;
        }
    },
}