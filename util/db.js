const mysql = require('mysql');
const configMysql = require("../config/mysql");

const  pool = mysql.createPool(configMysql.json());

module.exports = {
    load: function(sql,condition) {
        return new Promise(function(resolve, reject) {
            pool.getConnection(function(err, connection) {
                connection.query(sql,condition, function(error, results, fields) {
                    if (error) {
                        console.log(error); 
                        return resolve([]);
                    };
                    connection.release();
                    resolve(results);
                });
            });
        });
    },
    get: function(table,limit,offset) {
        return new Promise(function(resolve, reject) {
            pool.getConnection(function(err, connection) {
                connection.query(`SELECT * from ${table} LIMIT ? OFFSET ?`,[limit,offset], function(error, results, fields) {
                    if (error) {
                        console.log(error); 
                        return resolve([]);
                    };
                    connection.release();
                    resolve(results);
                });
            });
        });
    },
    insert: function(table, data) {
        return new Promise(function(resolve, reject) {
            pool.getConnection(function(err, connection) {
                connection.query(`INSERT INTO ${table} SET ?`, data, function(error, results, fields) {
                    if (error) {
                        console.log(error); 
                        return resolve([]);
                    };
                    connection.release();
                    resolve(results);
                });
            });
        });
    },
    getOneByCondition: function(table, condition) {
        return new Promise(function(resolve, reject) {
            pool.getConnection(function(err, connection) {
                connection.query(`select * from ${table} where ?`, condition, function(error, results, fields) {
                    if (error) {
                        console.log(error); 
                        return resolve([]);
                    };
                    connection.release();
                    resolve(results);
                });
            });
          
        });
    },
    delete: function(table, con) {
        return new Promise(function(resolve, reject) {
            pool.getConnection(function(err, connection) {
                connection.query(`DELETE FROM ${table} WHERE ?`, con, function(error, results, fields) {
                    if (error) {
                        console.log(error); 
                        return resolve([]);
                    };
                    connection.release();
                    resolve(results);
                });
            });
        });
    },


};