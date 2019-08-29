const winston = require('../config/winston')
const GraphPair = require('../models/graph');

const findGraph = (graph_id) => GraphPair.findById(graph_id)

module.exports = function getGraph(req, res) {
    let graph_id = req.params.graph_id;
    
    if(!graph_id){
        res.status(402)
        .json({
            error: 'No Graph ID Specified'
        })
    }

    winston.info(`Searching for graph with ID ${graph_id}`)
    findGraph(graph_id)
        .exec((err, graph_data) =>{
            if(err){
                winston.error(`Could not find graph with ${graph_id}`)
                res.status(404)
                .json({
                    error: `Could not find graph with ${graph_id}`
                })
            } else {
                winston.info("Graph Found.")
                res.status(200)
                .json(graph_data)
            }
        })
}
