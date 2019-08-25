var fs = require('fs')
var csv = require('csv-parser')
var winston = require('../config/winston')

const GraphPair = require('../models/graph');

const graphData = () => {
    return {
        ocd: {
            edge_list: null, 
            weight_matrix: null,
            coordinates: null, 
            node_names: null,
            node_ids: null,
            orbits: null
        },
        con: {
            edge_list: null, 
            weight_matrix: null,
            coordinates: null, 
            node_names: null,
            node_ids: null,
            orbits: null
        }
    }
} 

const csvParseOptions = {
    edge_list: {
        headers: ['from', 'to'],
        separator: ' ',
        mapValues: ({header, index, value}) =>{
            return Number(value);
        }
    },
    weight_matrix: {
        headers: false, //use row indices,
        separator: ' ',
        mapValues: ({header, index, value}) =>{
            // return Number(value);
            return value
        }
    },
    coordinates:{
        headers: ['x', 'y', 'z'],
        separator: ' ',
        mapValues: ({header, index, value}) =>{
            return Number(value);
        }
    }, 
    node_names: {
        headers: ['name'],
        separator: ' '
    },
    node_ids: {
        headers: ['id'],
        separator: ' '
    },
    orbits:{
        headers: false,
        separator: ' ',
        mapValues: ({header, index, value}) =>{
            return Number(value);
        }
    }
}

function readData(filepath, options){

    return new Promise((resolve, reject) =>{
        let results = [];
        fs.createReadStream(filepath)
            .pipe(csv(options))
            .on('data', (data) => {
                results.push(data)
            })
            .on('end', () => {
                resolve(results)
            })
            .on('error', (error) => {
                reject(error);
            })
    })
}

async function parseData(files){
    let data = graphData();
    let keys = Object.keys(files);
    for(let i = 0; i < keys.length; ++i){
        let filename = keys[i];
        let file = files[filename];

        let filetype = filename.substr(filename.indexOf('_') + 1);
        if(filename.startsWith('ocd')){
            //ocd graph data
            data.ocd[filetype] = await readData(file.path, csvParseOptions[filetype]);
        } else {
            //con graph data
            data.con[filetype] = await readData(file.path, csvParseOptions[filetype]);
        }
    }
    return data
}

function validateGraphData(graphData){
    winston.info("Validating graph data")

    let numNodes = graphData.node_names.length;
    let errors = []

    //disabling for now until we get a better data file from hayes
    //weight matrix check
    // if(graphData.weight_matrix.length != numNodes || Object.keys(graphData.weight_matrix[0]).length != numNodes){
    //     let height = weight_matrix.length;
    //     let width = Object.keys(weight_matrix[0]).length;
    //     errors.push(`Weight Matrix size does not match node name list. Expected: ${numNodes}x${numNodes}. Recieved: ${height}x${width}`)
    // }

    //coordinate check
    if(graphData.coordinates.length != numNodes){
        winston.error("Graph Coordinates invalid")
        let numCoordinates = graphData.coordinates.length;
        errors.push(`Coordinates list is not correct length. Expected ${numNodes}. Recieved ${numCoordinates}`);
    }

    //node_ids check
    if(graphData.node_ids.length != numNodes){
        winston.error("Graph node ids invalid")
        let numIds = graphData.node_ids.length;
        errors.push(`Node IDs list is not correct length. Expected ${numNodes}. Recieved ${numIds}.`);
    }

    //orbits
    if(graphData.orbits.length != numNodes){
        winston.error("Graph orbits invalid")
        let orbits = graphData.orbits.length;
        errors.push(`Orbit list is not correct length. Expected ${numNodes}. Recieved: ${orbits}`);
    }

    //edge list
    for(let i = 0; i < graphData.edge_list.length; ++i){
        let edge = graphData.edge_list[i];
        if(edge.to < 0 || edge.to > numNodes || edge.from < 0 || edge.from > numNodes){
            errors.push('Invalid node ids found in edge list');
            winston.error("Graph edge list invalid")
            break;
        }
    }

    return errors.length > 0 ? errors : null;
}

function getEdgeList(edgeList, weight_matrix, node_id){
    let data = [];
    edgeList.forEach(edge =>{
        if(edge.from === node_id){
            // let edgeWeight = weight_matrix[node_id][edge.to];     FOR NOW, this format isn't working
            let edgeWeight = Math.random()
            data.push({
                to: edge.to,
                weight: edgeWeight
            })
        }
    })
    return data;
}

function getOrbitList(orbits){
    let data = [];
    let orbitNums = Object.keys(orbits);
    for(let i = 0; i < orbitNums.length; ++i){
        let orbitNumber = orbitNums[i]; //orbitNum is a string value
        data.push({
            id: Number(orbitNumber),
            frequency: orbits[orbitNumber]
        })
    }
    return data;
}

function makeGraph(graphData, filenames){

    let errors = validateGraphData(graphData);
    if(errors){
        winston.error("Errors detected in graph data. Throwing error");
        throw new Error(errors.join('\n'));
    }

    //error free - supposedly
    let numNodes = graphData.node_names.length;
    let nodeList = [];
    for(let i = 0; i < numNodes; ++i){
        let new_node = {
            id: i, 
            abbrev_name: graphData.node_ids[i].id,
            full_name: graphData.node_names[i].name,
            edges: getEdgeList(graphData.edge_list, graphData.weight_matrix, i),
            orbits: getOrbitList(graphData.orbits[i])
        }
        nodeList.push(new_node);
    }

    winston.info(`${numNodes} new nodes creates successfully`)
    return {
        filenames:{
            edge_list: filenames.edge_list,
            weight_matrix: filenames.weight_matrix,
            coordinates: filenames.coordinates,
            node_names: filenames.node_names,
            node_ids: filenames.node_ids,
            orbits: filenames.orbits
        },
        nodes: nodeList
    }
}

function makeGraphPair(graphData, files, metadata){
    winston.info("Creating OCD Graph Data")
    let ocd_graph = makeGraph(graphData.ocd, {
        edge_list:      files['ocd_edge_list'].name,
        weight_matrix:  files['ocd_weight_matrix'].name,
        coordinates:    files['ocd_coordinates'].name,
        node_names:     files['ocd_node_names'].name,
        node_ids:       files['ocd_node_ids'].name,
        orbits:         files['ocd_orbits'].name
    })

    winston.info("Creating CON Graph Data")
    let con_graph = makeGraph(graphData.con, {
        edge_list:      files['con_edge_list'].name,
        weight_matrix:  files['con_weight_matrix'].name,
        coordinates:    files['con_coordinates'].name,
        node_names:     files['con_node_names'].name,
        node_ids:       files['con_node_ids'].name,
        orbits:         files['con_orbits'].name
    })

    winston.info("Creating new GraphPair Object")
    var newGraphPair = new GraphPair({
        name: metadata.name, 
        author: metadata.author,
        graphs:{
            ocd: ocd_graph,
            con: con_graph
        }
    })

    winston.info("Saving Graph Pair to Database")
    return newGraphPair.save();
}

module.exports = function newGraph(metadata, files){
    winston.info("Received New Graph data")
    //takes in new metadata and files
    //read in data from files into objects
    return parseData(files)
    .then((data) => makeGraphPair(data, files, metadata))
    .then((graph_doc) =>{
        return graph_doc.id;
    })
}