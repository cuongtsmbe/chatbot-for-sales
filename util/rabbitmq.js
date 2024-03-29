const config = require("../config/default.json");
const amqp = require('amqplib');
const createPool = require('generic-pool').createPool;
require('dotenv').config();
const buyerUtil = require("./buyer");
const urlRabbitMQ = `amqp://${process.env.RABBITMQ_DEFAULT_USER}:${process.env.RABBITMQ_DEFAULT_PASS}@rabbitmq`;

const connectionFactory = {
    create: async function () {
        const connection =await amqp.connect(urlRabbitMQ);
        console.log(`[Worker ${process.pid}] Created connection(RabbitMQ)`);
        return connection;
    },
    destroy: function (connection) {
        connection.close();
        console.log(`[Worker ${process.pid}] Destroyed connection(RabbitMQ)`);
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
        console.log(`[Worker ${process.pid}] Created channel(RabbitMQ)`);
        return channel;
    },
    destroy: function (channel) {
        channel.close();
        console.log(`[Worker ${process.pid}] Destroyed channel(RabbitMQ)`);
    },
    validate: function (channel) {
        //nếu channel không hợp lệ (ví dụ: đã bị đóng) pool sẽ tự xóa channel và tạo ra channel mới để thay thế 
        return channel && channel.isOpen();
    }
};

//create connect pool rabbitMQ
const connectionPool = createPool(connectionFactory, {
    max: config.rabbitMQ.connection.max,
    min: config.rabbitMQ.connection.min,
    idleTimeoutMillis:10000
});

//create channel pool rabbitMQ
const channelPool = createPool(channelFactory,{
    max: config.rabbitMQ.channel.max,
    min: config.rabbitMQ.channel.min, 
});


//listen and console err of pool
connectionPool.on('factoryCreateError', function(err){
        console.log(`[Worker ${process.pid}] RabbitMQ factoryCreateError :`, err);
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
            await channel.assertQueue(config.rabbitMQ.name_queue.conversation, { 
                // sử dụng cùng một cấu hình với producer,đảm bảo tính bền vững và đáng tin cậy của hệ thống
                durable: true 
            });
            await channel.prefetch(config.rabbitMQ.consumer.prefetch); // chỉ định số lượng tin nhắn tối đa trên consumer này
            console.log(`[Worker ${process.pid}] Waiting for messages in %s. To exit, press CTRL+C `, config.rabbitMQ.name_queue.conversation);
            await channel.consume(
                config.rabbitMQ.name_queue.conversation,
                async (msg) => {
                    try{
                        // xử lý tin nhắn
                        console.log(`[Worker ${process.pid}] ID : ${IDConsumer} - received message: ${msg.content.toString()}`);

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
            await channel.assertQueue(config.rabbitMQ.name_queue.conversation, { 
                //create queue with durable:true ,queue sẽ được lưu trữ trên đĩa cứng và không bị mất nếu RabbitMQ server bị sập hoặc khởi động lại.
                durable: true 
            });
            channel.sendToQueue(config.rabbitMQ.name_queue.conversation, Buffer.from(msg), { 
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
