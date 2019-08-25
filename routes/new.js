var fs = require('fs')
var csv = require('csv-parser')

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

const csv_parse_options = {
    edge_list: {
        headers: ['to', 'from'],
        separator: ' ',
        mapValues: ({header, index, value}) =>{
            return Number(value);
        }
    },
    weight_matrix: {
        headers: false, //use row indices,
        separator: '   ',
        mapValues: ({header, index, value}) =>{
            return Number(value);
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
        separator: ' ',
        mapValues: ({header, index, value}) =>{
            return Number(value);
        }
    },
    orbits:{
        headers: false,
        separator: ' ',
        mapValues: ({header, index, value}) =>{
            return Number(value);
        }
    }
}

function read_data(filepath, options){

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

async function create_graph_data(files){
    let data = graphData();
    let keys = Object.keys(files);
    for(let i = 0; i < keys.length; ++i){
        let filename = keys[i];
        let file = files[filename];

        let filetype = filename.substr(filename.indexOf('_') + 1);
        if(filename.startsWith('ocd')){
            //ocd graph data
            data.ocd[filetype] = await read_data(file.path, csv_parse_options[filetype]);
        } else {
            //con graph data
            data.con[filetype] = await read_data(file.path, csv_parse_options[filetype]);
        }
    }
    return data
}

module.exports = function newGraph(metadata, files){
    //takes in new metadata and files
    //read in data from files into objects
    return create_graph_data(files).then((data) =>{
        return data;
    });
}