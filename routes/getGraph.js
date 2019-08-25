const GraphPair = require('../models/graph');

const findGraph = (graph_id) => GraphPair.findById(graph_id)

module.exports = function getGraph(req, res) {
    let graph_id = req.params.graph_id;
    findGraph(graph_id)
        .then(graph_data => {
            res.json(graph_data);
        })
        .catch(err => {
            res.status(420).send(err.errors);
        })
}