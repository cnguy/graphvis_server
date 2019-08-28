var fs = require('fs')
var csv = require('csv-parser')
var winston = require('../config/winston')

const GraphPair = require('../models/graph');

const graphFiles = () => {
    return {
        edgeList: null, 
        coordinates: null, 
        nodeNames: null,
        nodeIds: null,
        orbits: null
    }
}

const graphData = () => {
    return {
        ocd: graphFiles(),
        con: graphFiles()
    }
} 

const allowedFiles = () => {
    let graph_data = graphData();
    return Object.keys(graph_data).map(gtype =>{
        return Object.keys(graph_data[gtype]).map(filetype =>{
            return `${gtype}_${filetype}`;
        })
    }).flat();
}

const csvParseOptions = {
    edgeList: {
        // NOTE: if the edge list has 2 columns, then the weight column will be "undefined"
        headers: ['from', 'to', 'weight'],
        separator: ' ',
        mapValues: ({value}) =>{
            return Number(value);
        }
    },
    coordinates:{
        headers: ['x', 'y', 'z'],
        separator: ' ',
        mapValues: ({value}) =>{
            return Number(value);
        }
    }, 
    nodeNames: {
        headers: ['name'],
        separator: ' '
    },
    nodeIds: {
        headers: ['id'],
        separator: ' '
    },
    orbits:{
        headers: false,
        separator: ' ',
        mapValues: ({value}) =>{
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
            if(filetype in data.ocd){
                data.ocd[filetype] = await readData(file.path, csvParseOptions[filetype]);
            }
            
        } else {
            //con graph data
            if(filetype in data.con){
                data.con[filetype] = await readData(file.path, csvParseOptions[filetype]);
            }
        }
    }
    return data
}

function validateGraphData(graphData){
    winston.info("Validating graph data")

    let numNodes = graphData.nodeNames.length;
    let errors = []

    //coordinate check
    if(graphData.coordinates.length != numNodes){
        winston.error("Graph Coordinates invalid")
        let numCoordinates = graphData.coordinates.length;
        errors.push(`Coordinates list is not correct length. Expected ${numNodes}. Recieved ${numCoordinates}`);
    }

    //node_ids check
    if(graphData.nodeIds.length != numNodes){
        winston.error("Graph node ids invalid")
        let numIds = graphData.nodeIds.length;
        errors.push(`Node IDs list is not correct length. Expected ${numNodes}. Recieved ${numIds}.`);
    }

    //orbits
    if(graphData.orbits.length != numNodes){
        winston.error("Graph orbits invalid")
        let orbits = graphData.orbits.length;
        errors.push(`Orbit list is not correct length. Expected ${numNodes}. Recieved: ${orbits}`);
    }

    //edge list
    for(let i = 0; i < graphData.edgeList.length; ++i){
        let edge = graphData.edgeList[i];
        if(edge.to < 0 || edge.to > numNodes || edge.from < 0 || edge.from > numNodes){
            errors.push('Invalid node ids found in edge list');
            winston.error("Graph edge list invalid")
            break;
        }
    }

    return errors.length > 0 ? errors : null;
}

function getEdgeList(edgeList, node_id){
    let data = [];
    edgeList.forEach(edge => {
        if(edge.from === node_id){
            // let edgeWeight = weight_matrix[node_id][edge.to];     FOR NOW, this format isn't working
            data.push({
                to: edge.to,
                weight: edge.weight
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
    let numNodes = graphData.nodeNames.length;
    let nodeList = [];
    for(let i = 0; i < numNodes; ++i){
        let new_node = {
            id: i, 
            abbrevName: graphData.nodeIds[i].id,
            fullName: graphData.nodeNames[i].name,
            coordinates: {
                x: graphData.coordinates[i].x,
                y: graphData.coordinates[i].y,
                z: graphData.coordinates[i].z
            },
            edges: getEdgeList(graphData.edgeList, i),
            orbits: getOrbitList(graphData.orbits[i])
        }
        nodeList.push(new_node);
    }

    winston.info(`${numNodes} new nodes creates successfully`)
    return {
        filenames:{
            edgeList: filenames.edgeList,
            coordinates: filenames.coordinates,
            nodeNames: filenames.nodeNames,
            nodeIds: filenames.nodeIds,
            orbits: filenames.orbits
        },
        nodes: nodeList
    }
}

function makeGraphPair(graphData, files, metadata){
    winston.info("Creating OCD Graph Data")
    let ocd_graph = makeGraph(graphData.ocd, {
        edgeList:      files['ocd_edgeList'].name,
        coordinates:   files['ocd_coordinates'].name,
        nodeNames:     files['ocd_nodeNames'].name,
        nodeIds:       files['ocd_nodeIds'].name,
        orbits:        files['ocd_orbits'].name
    })

    winston.info("Creating CON Graph Data")
    let con_graph = makeGraph(graphData.con, {
        edgeList:      files['con_edgeList'].name,
        coordinates:   files['con_coordinates'].name,
        nodeNames:     files['con_nodeNames'].name,
        nodeIds:       files['con_nodeIds'].name,
        orbits:        files['con_orbits'].name
    })

    winston.info("Creating new GraphPair Object")
    var newGraphPair = new GraphPair({
        name: metadata.graphName, 
        author: metadata.author,
        graphs:{
            ocd: ocd_graph,
            con: con_graph
        }
    })

    winston.info("Saving Graph Pair to Database")
    return newGraphPair.save();
}

function verifyFiles(files){
    return new Promise((resolve, reject) =>{
        let allowed_files = allowedFiles();
        let sentFiles = Object.keys(files);
        for(let i = 0; i < sentFiles.length; ++i){
            if(!allowed_files.includes(sentFiles[i])){
                reject(new Error(`Unexpected files in request. Accepted files are ${allowed_files}`))
            }
        }
        resolve()
    })
    
}


module.exports = function newGraph(req, res){
    let files = req.files;
    let metadata = req.fields;

    verifyFiles(files)
        .then(() => parseData(files))
        .then((data) => makeGraphPair(data, files, metadata))
        .then((graph_doc) => {
            res.status(200).json({
                hash: graph_doc.id
            });
        })
        .catch(err =>{
            winston.error(err.message);
            res.status(402).json({
                errors: err.message
            })
        })

}