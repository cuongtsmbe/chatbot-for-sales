const config = require("../config/default.json");
const amqp = require('amqplib');
const createPool = require('generic-pool').createPool;
require('dotenv').config();
const buyerUtil = require("./buyer");
const urlRabbitMQ = `amqp://${process.env.RABBITMQ_DEFAULT_USER}:${process.env.RABBITMQ_DEFAULT_PASS}@rabbitmq`;

const connectionFactory = {
    create: async function () {
        const connection =await amqp.connect(urlRabbitMQ);
        console.log('Created connection');
        return connection;
    },
    destroy: function (connection) {
        connection.close();
        console.log('Destroyed connection');
    },
    validate: function (connection) {
        //nếu connection không hợp lệ (ví dụ: đã bị đóng) pool sẽ tự xóa và tạo ra một kết nối mới để thay thế   
        return connection && connection.isOpen();
    },
};

const channelFactory =  {
    create: async function () {
        //khi channel chưa có thì sẽ lấy connection trong Pool và tại channel trên connection đó
        const connection = await connectionPool.acquire();
        const channel = await connection.createChannel();
        console.log('Created channel');
        return channel;
    },
    destroy: function (channel) {
        channel.close();
        console.log('Destroyed channel');
    },
    validate: function (channel) {
        //nếu channel không hợp lệ (ví dụ: đã bị đóng) pool sẽ tự xóa channel và tạo ra channel mới để thay thế 
        return channel && channel.isOpen();
    }
};

//create connect pool rabbitMQ
const connectionPool = createPool(connectionFactory, {
    max: config.maxPoolConnectionRabbitMQ,
    min: config.minPoolConnectionRabbitMQ,
    idleTimeoutMillis:10000
});

//create channel pool rabbitMQ
const channelPool = createPool(channelFactory,{
    max: config.maxPoolChannelRabbitMQ,
    min: config.minPoolChannelRabbitMQ, 
});


//listen and console err of pool
var errPool="";
connectionPool.on('factoryCreateError', function(err){
    if(!errPool){
        errPool=err;
        console.log("RabbitMQ factoryCreateError :", err);
    }
})

//giải phóng connect and channel trong pool khi tiến trình nhận "SIGNINT"(Ctrl + C)
process.on('SIGINT',() => {
    channelPool.drain().then(() => channelPool.clear());
    connectionPool.drain().then(() => connectionPool.clear());
});

module.exports = {
    //create consumer listen queue of rabbitMQ and resolve
    consumerRabbitMQ: async function (IDConsumer) {
        try{
            //lấy channel từ pool channel
            const channel = await channelPool.acquire();
            await channel.assertQueue(config.queueCoversation, { 
                // sử dụng cùng một cấu hình với producer,đảm bảo tính bền vững và đáng tin cậy của hệ thống
                durable: true 
            });
            await channel.prefetch(config.prefetchConsumerRabbitMQ); // chỉ định số lượng tin nhắn tối đa trên consumer này
            console.log("Waiting for messages in %s. To exit, press CTRL+C ", config.queueCoversation);
            await channel.consume(
                config.queueCoversation,
                async (msg) => {
                    try{
                        // xử lý tin nhắn
                        console.log(`ID : ${IDConsumer} - received message: ${msg.content.toString()}`);

                        const value = JSON.parse(msg.content.toString());

                        if(value.type == "add"){ 
                            //add new buyer
                            await  buyerUtil.addNewBuyer(
                                value.FanpageDetails,
                                value.buyer_facebook_psid,
                                value.AIReplySummary
                            );
                        }

                        if(value.type == "update"){                      
                            //update buyer info
                            await  buyerUtil.updateFacebookUserInfo(
                                value.buyer,
                                value.FanpageDetails,
                                value.buyer_facebook_psid
                            );
                        }

                        channel.ack(msg);
                    }catch(e){
                        console.log("-ERROR consume rabbitMQ :",e);
                    }
                    
                },
                { 
                    noAck: false //yêu cầu channel gửi ack khi xử lý xong message
                }
            );
            //đóng channel khi tiến trình nhận "SIGNINT"(Ctrl + C)
            process.on('SIGINT', () => {
                channelPool.release(channel);
            });
        }catch(e){
            console.error('Error occurred producerRabbitMQ to queue:', e);
            channelPool.drain().then(() => channelPool.clear());
        }
    },
    
    //send msg to rabbitMQ
    producerRabbitMQ:async function(msg){
        try {
            //lấy channel từ pool channel
            const channel = await channelPool.acquire();
            await channel.assertQueue(config.queueCoversation, { 
                //create queue with durable:true ,queue sẽ được lưu trữ trên đĩa cứng và không bị mất nếu RabbitMQ server bị sập hoặc khởi động lại.
                durable: true 
            });
            channel.sendToQueue(config.queueCoversation, Buffer.from(msg), { 
                //lưu dữ tin nhắn vào đĩa cứng trc khi gửi cho consumer để tránh mất khi rabbitMQ có vấn đề
                persistent: true 
            });

            channelPool.release(channel);
        }catch(e){
            console.error('Error occurred producerRabbitMQ to queue:', e);
            channelPool.drain().then(() => channelPool.clear());
        }

    }
     
    
}
