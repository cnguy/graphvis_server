const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var GraphSchema = new Schema({
    name: String
})

module.exports = mongoose.model('Graph', GraphSchema)