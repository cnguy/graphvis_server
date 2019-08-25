const mongoose = require('mongoose'),
    Schema = mongoose.Schema

// An edge is contained in an edge list, so "to" represents the destination of the edge, 
// where the origin is the node object this edge is contained in
var EdgeSchema = new Schema({
    to: Number,             //destination
    weight: Number          // float: weight of edge
})

var OrbitSchema = new Schema({
    id: Number,             // orbit id: [1, 73]
    frequency: Number       // frequency this node appears in this orbit
})

var NodeSchema = new Schema({
    id: Number,             //id of the node
    name: String,           //name of the node
    edges: [EdgeSchema],    //edge list
    orbits: [OrbitSchema]   //orbit list
})

// Note: The top 5 fields are filenames, not actual data. 
// Keep record of the filename in case the user wants to reference which files were used for this graph pair
var GraphSchema = new Schema({
    filenames:{
        edge_list: String, 
        weight_matrix: String, 
        coordinates: String, 
        node_names: String,
        node_ids: String, 
        orbits: String,
    },
    nodes: [NodeSchema]
})

var GraphPairSchema = new Schema({
    name: String,                               //name of the graph
    author: {type: String, default: ''},        //graph creator
    created: {type: Date, default: Date.now},   // date graph was created
    graphs: {
        ocd: GraphSchema,
        con: GraphSchema
    }
})

module.exports = mongoose.model('Graph', GraphPairSchema)