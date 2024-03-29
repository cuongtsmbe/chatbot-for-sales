require('dotenv').config();
module.exports={
    json :function(){
        return {
            host            : process.env.MYSQL_HOST,
            user            : process.env.MYSQL_USER,
            password        : process.env.MYSQL_PASSWORD,
            database        : process.env.MYSQL_DATABASE,
            port            : process.env.MYSQL_PORT,
            connectionLimit : 50,
        };
    }
}  
