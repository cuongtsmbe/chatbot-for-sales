const amqplib = require('amqplib');
const queue = 'conversation_queue';
const urlRabbitmq='amqp://admin:admin@rabbitmq';

module.exports = {
    
    listenerRabbitMQ:async function(){
        try{
            // Kết nối đến RabbitMQ
            const conn = await amqplib.connect(urlRabbitmq);
            const channel = await conn.createChannel();
            //tạo queue nếu chưa tồn tại
            await channel.assertQueue(queue,{
                durable: true //dữ liệu đc lưu . khi restart vẫn giữ data
            });
            console.log("Waiting for messages in %s. To exit, press CTRL+C ", queue);
            // Sử dụng 2 worker để xử lý các message đồng thời
            channel.prefetch(2);
            // Listener
            channel.consume(queue, (msg) => {
                if (msg !== null) {
                console.log('Recieved:', msg.content.toString());
                // Thực hiện truy vấn MySQL
                
                
                
                channel.ack(msg);
                } else {
                console.log('Consumer cancelled by server');
                }
            },{
                //yêu cầu channel gửi ack khi xử lý xong message
                noAck: false
            });
        }catch(e){
            console.log(e);
        }
            
    },

    senderRabbitMQ:async function(text){
        try{
            // Kết nối đến RabbitMQ
            const conn = await amqplib.connect(urlRabbitmq);
            const channel = await conn.createChannel();
           
            channel.sendToQueue(queue,Buffer.from(text));
            
        }catch(e){
            console.log(e);
        }
    }
    
}
