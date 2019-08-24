const Graph = require('../models/graph');

module.exports = function new_graph(metadata, files){
    //takes in new metadata and files
    var new_graph = new Graph({name: 'foo'})
    //returns a hash to access this graph
    return 'hash'
}