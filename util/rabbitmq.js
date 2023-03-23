const conversationModel = require('../models/conversation.model');
const config = require("../config/default.json");
const amqp = require('amqplib');
const createPool = require('generic-pool').createPool;
require('dotenv').config();
const urlRabbitmq = `amqp://${process.env.RABBITMQ_DEFAULT_USER}:${process.env.RABBITMQ_DEFAULT_PASS}@rabbitmq`;

// tạo connection pool
const factory = {
  create: async function () {
    return await amqp.connect(urlRabbitmq);
  },
  destroy: function (conn) {
    conn.close();
  },
};
const opts = {
  max: config.maxPoolRabbitMQ,
  min: config.minPoolRabbitMQ,   
  evictionRunIntervalMillis: 1000,//pool sẽ kiểm tra các kết nối đang sử dụng và đóng các kết nối không còn sử dụng sau mỗi giây 
};
const pool = createPool(factory, opts);

//listen and console err of pool
var errPool="";
pool.on('factoryCreateError', function(err){
    if(!errPool){
        errPool=err;
        console.log("factoryCreateError :", err);
    }
  
})

//giải phóng connect trong pool khi tiến trình nhận "SIGNINT"(Ctrl + C)
process.on('SIGINT', async () => {
    await pool.drain();
    await pool.clear();
});

module.exports = {
    //create consumer listen queue of rabbitMQ and resolve
    consumerRabbitMQ: async function () {
        try{
            const conn = await pool.acquire();
            const channel = await conn.createChannel();
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
                        console.log(`Received message: ${msg.content.toString()}`);
                        // Thực hiện truy vấn them conversation vao MySQL
                        conversationModel.add(JSON.parse(msg.content.toString())).then(result => {
                            //thêm data conversation vào DB thành công 
                            if(result.length!=0){
                                channel.ack(msg);
                            }
                        });
                    }catch(e){
                        console.log("-Error conversationModel.add tai rabbitmq.js");
                    }
                },
                { 
                    noAck: false //yêu cầu channel gửi ack khi xử lý xong message
                }
            );
            //đóng channel khi tiến trình nhận "SIGNINT"(Ctrl + C)
            process.on('SIGINT', () => {
                channel.close();
            });
        }catch(e){
            console.log(e);
        }
    },
    
    //send msg to rabbitMQ
    producerRabbitMQ:async function(msg){
        const conn = await pool.acquire();
        const channel = await conn.createChannel();
        await channel.assertQueue(config.queueCoversation, { 
            //create queue with durable:true ,queuesẽ được lưu trữ trên đĩa cứng và không bị mất nếu RabbitMQ server bị sập hoặc khởi động lại.
            durable: true 
        });
        
        try {
            const sent = channel.sendToQueue(config.queueCoversation, Buffer.from(msg), { 
                //lưu dữ tin nhắn vào đĩa cứng trc khi gửi cho consumer để tránh mất khi rabbitMQ có vấn đề
                persistent: true 
            });
            //khi gửi KHÔNG thành công thì yêu cầu gửi lại
            if (!sent) {
                await pool.release(channel);
                await sendMessages(msg);
                return;
            }
         
        }catch(e){
            console.log(e);
        }finally {
            //trả lại kết nối cho pool và đóng channel
            channel.close();
            await pool.release(conn);
        }

    }
     
    
}
