require('dotenv').config();
const mysql = require('mysql');
const { promisify } = require('util');
const { NODE_ENV, SQL_USER, SQL_PASSWORD, SQL_DB, SQL_DB_TEST, SQL_HOST } = process.env;
const env = NODE_ENV || 'production';

const mysqlConfig = {
  production: {
    host: SQL_HOST,
    user: SQL_USER,
    password: SQL_PASSWORD,
    database: SQL_DB
  },
  development: {
    host: SQL_HOST,
    user: SQL_USER,
    password: SQL_PASSWORD,
    database: SQL_DB
  },
  test: {
    host: SQL_HOST,
    user: SQL_USER,
    password: SQL_PASSWORD,
    database: SQL_DB_TEST
  }
};

const mysqlCon = mysql.createConnection(mysqlConfig[env]);

const promiseQuery = (query, bindings) => {
  return promisify(mysqlCon.query).bind(mysqlCon)(query, bindings);
};

const promiseTransaction = promisify(mysqlCon.beginTransaction).bind(mysqlCon);
const promiseCommit = promisify(mysqlCon.commit).bind(mysqlCon);
const promiseRollback = promisify(mysqlCon.rollback).bind(mysqlCon);
const promiseEnd = promisify(mysqlCon.end).bind(mysqlCon);

module.exports = {
  core: mysql,
  query: promiseQuery,
  transaction: promiseTransaction,
  commit: promiseCommit,
  rollback: promiseRollback,
  end: promiseEnd,
};
