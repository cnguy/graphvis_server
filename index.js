var express = require('express');
var morgan = require('morgan');
var cors = require('cors');
var winston = require('./config/winston')
var formiddable = require('express-formidable')
var bodyParser = require('body-parser')
var mongoose = require('mongoose')

const newGraph = require('./routes/newGraph');
const getGraph = require('./routes/getGraph');
const mongo_config = require('./config/mongo')

var app = express()

//middleware management
const dev_status = process.env.NODE_ENV

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

//Use winston for main output, but utilize the Morgan middleware. Sends to winston as a stream
var logger_settings = 'common'
app.use(morgan(logger_settings, { stream: winston.stream }))


// app.options('*', cors());

// Formiddle is used to parse the form data we send back (files)
const formiddableOptions = {
    type: 'multipart',
    multiples: true
}
app.use(formiddable(formiddableOptions))


//Body Parser is used to parse the body of the requests we make
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())






//connect to database
mongoose.connect(mongo_config.URI,{useNewUrlParser: true})
    .catch(error => {
        winston.error("Could not connect to database")
    })

var test = mongoose.connection;
test.on('error', console.error.bind(console, 'connection error:'))
test.once('open', () => {
    winston.info('Successfully connected to database')
})




// Routes
app.post('/api/graph/new', (req, res) => newGraph(req, res));
app.get('/api/graph/id/:graph_id', (req, res) => getGraph(req, res));



app.listen(5415, function () {
    console.log('Listening on port 5415!')
})
