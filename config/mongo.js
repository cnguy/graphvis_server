
const dev_status = process.env.NODE_ENV
const PROD_URI = 'localhost:27017/graphvis'
const DEV_URI = 'localhost:27017/graphvis'


function get_uri(){
    if(dev_status && dev_status === 'PRODUCTION'){
        return 'mongodb://' + PROD_URI
    } else {
        return 'mongodb://' + DEV_URI
    }
}

const mongoose_settings = {
    URI: get_uri()
}

module.exports = mongoose_settings;