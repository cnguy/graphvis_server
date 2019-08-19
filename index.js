var express = require('express');
var morgan = require('morgan');
var cors = require('cors');
var winston = require('./config/winston')
var formiddable = require('express-formidable')

var app = express()

//middleware management
const dev_status = process.env.NODE_ENV

var logger_settings = 'common'
//logging middleware
app.use(morgan(logger_settings, { stream: winston.stream }))

//cors middleware
var allowed_origins = '*'
if (dev_status !== undefined && dev_status === 'PRODUCTION') {
    allowed_origins = 'localhost';
}
const corsOptions = {
    origin: allowed_origins,
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }

app.use(cors(corsOptions))

// Formiddable
const formiddableOptions = {
    type: 'multipart',
    multiples: true
}
app.use(formiddable())


// Routes
app.post('/graph/new', (req, res) => {

})

// retrieves the graph set given a hash-key
app.get('/graph/:key', (req, res) =>{

})

app.listen(5415, function () {
    console.log('Listening on port 5415!')
})
