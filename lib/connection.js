'use strict';

const Promise = require(`bluebird`);
const mysql = require(`mysql`);
const promiseCallback = require(`./helper`).promiseCallback;

class connection {
    constructor(config = {}, _connection) {
        let mysqlValue = mysql;

        if (config.wrapper) {
            mysqlValue = config.wrapper(mysql);
            delete config.wrapper;
        }

        if (config.paramsArray) {
            this.paramsArray = config.paramsArray;
            delete config.paramsArray;
        }

        this.config = config;

        if (!_connection) {
            _connection = Promise.resolve(mysqlValue).then((mysql) => {
                return connect(mysql, this.config);
            });
        }

        return Promise.resolve(_connection).then((connection) => {
            this.connection = connection;

            return this;
        })
    }

    query() {
        return promiseCallback.apply(this.connection, [`query`, arguments, this.paramsArray]);
    }

    beginTransaction() {
        return promiseCallback.apply(this.connection, [`beginTransaction`, arguments, this.paramsArray]);
    }

    commit() {
        return promiseCallback.apply(this.connection, [`commit`, arguments, this.paramsArray]);
    }

    rollback() {
        return promiseCallback.apply(this.connection, [`rollback`, arguments, this.paramsArray]);
    }

    changeUser() {
        return promiseCallback.apply(this.connection, [`changeUser`, arguments, this.paramsArray]);
    }

    ping() {
        return promiseCallback.apply(this.connection, [`ping`, arguments, this.paramsArray]);
    }

    statistics() {
        return promiseCallback.apply(this.connection, [`statistics`, arguments, this.paramsArray]);
    }

    end() {
        return promiseCallback.apply(this.connection, [`end`, arguments, this.paramsArray]);
    }

    destroy() {
        this.connection.destroy();
    }

    pause() {
        this.connection.pause();
    }

    resume() {
        this.connection.resume();
    }

    escape(value) {
        return this.connection.escape(value);
    }

    escapeId(value) {
        return this.connection.escapeId(value);
    }

    format(sql, values) {
        return this.connection.format(sql, values);
    }
}

const connect = (mysql, config) => {
    const connection = mysql.createConnection(config);

    connection.on(`error`, (err) => {
        if(
            err.code === `PROTOCOL_CONNECTION_LOST` ||
            err.code === `ECONNRESET` ||
            err.code === `PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR`
        ) {
            connect(mysql, config);
        }
    });

    return new Promise((resolve, reject) => {
        connection.connect((err) => {
            if (err) {
                return reject(err);
            } else {
                return resolve(connection);
            }
        })
    });
}

module.exports = connection;
