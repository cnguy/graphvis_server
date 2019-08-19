const { AssertionError } = require('assert')
const winston = require('../config/winston')

module.exports.handleAssertionError = function(error, req, res, next){
    if(error instanceof AssertionError){
        return res.status(400).json({
            message: error.message
        });
    }
    next(error);
}

module.exports.catchAll = function(error, req, res, next){
    winston.error(error.message);
    if(!error.statusCode) 
        error.statusCode = 500;
    res.status(error.statusCode).send(error.message)
    next(error)
}