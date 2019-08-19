const winston = require('winston');
const { combine, timestamp, label, printf, colorize } = winston.format;
const path = require('path');

const LOG_DIR = 'logs'

const myFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});

var options = {
    file: {
        level: 'info',
        filename: path.join(LOG_DIR, 'combined.log'),
        handleExceptions: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    },
    console: {
        level: 'debug',
        handleExceptions: true,
        format: combine(
            label({ label: 'DEV' }),
            colorize(),
            timestamp(),
            myFormat
        )
    },
    exceptions: {
        filename: path.join(LOG_DIR, 'exceptions.log')
    }
};


var logger = new winston.createLogger({
    transports: [
        new winston.transports.File(options.file),
    ],
    exceptionHandlers:[
        new winston.transports.File(options.exceptions)
    ],
    exitOnError: false, // do not exit on handled exceptions
});

//add in console output if necessary
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console(options.console));
  }

  //streasm for morgan middleware
logger.stream = {
    write: function (message, encoding) {
        logger.info(message);
    },
};

module.exports = logger;