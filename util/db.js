const mysql = require('mysql');
const configMysql = require("../config/mysql");

const  connection = mysql.createConnection(configMysql.json());
connection.connect();

module.exports = {
    load: function(sql,condition) {
        return new Promise(function(resolve, reject) {
        
            connection.query(sql,condition, function(error, results, fields) {
                if (error) {
                    console.log(error); 
                    return resolve([]);
                };
                resolve(results);
            });
            
        });
    },
    get: function(table,limit,offset) {
        return new Promise(function(resolve, reject) {
           
            connection.query(`SELECT * from ${table} LIMIT ? OFFSET ?`,[limit,offset], function(error, results, fields) {
                if (error) {
                    console.log(error); 
                    return resolve([]);
                };
                resolve(results);
            });

            
        });
    },
    insert: function(table, data) {
        return new Promise(function(resolve, reject) {
          
            connection.query(`INSERT INTO ${table} SET ?`, data, function(error, results, fields) {
                if (error) {
                    console.log(error); 
                    return resolve([]);
                };
                resolve(results);
            });

        });
    },
    getOneByCondition: function(table, condition) {
        return new Promise(function(resolve, reject) {
           
            connection.query(`select * from ${table} where ?`, condition, function(error, results, fields) {
                if (error) {
                    console.log(error); 
                    return resolve([]);
                };

                resolve(results);
            });

          
        });
    },
    delete: function(table, con) {
        return new Promise(function(resolve, reject) {
           
            connection.query(`DELETE FROM ${table} WHERE ?`, con, function(error, results, fields) {
                if (error) {
                    console.log(error); 
                    return resolve([]);
                };
                resolve(results);
            });

        });
    },


};