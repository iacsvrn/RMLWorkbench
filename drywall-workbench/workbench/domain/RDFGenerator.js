var method = RDFGenerator.prototype;
var mongoose = require('mongoose');
var fs = require('fs');

function RDFGenerator() {
}

//execute a mapping using the RML processor
method.execute = function(mappingfile, triples, needed, callback) {


    var rdf; //storing the rdf output
    var triplenames = ''; //storing the triple names for the command parameters
    //creating triplenames
    for(var i = 0; i < triples.length; i++) {
        if(i < (triples.length - 1)) {
            triplenames += triples[i].title + ',';
        } else {
            triplenames += triples[i].title;
        }
        
    }

    //in case there are no local source files needed
    if(needed.length == 0) {
        method.spawnRmlMapper(mappingfile.id, mappingfile.filename, triplenames, needed, (result) => {
                            rdf = result;
                            callback(rdf);
                        });           
    }

	//write file main directory 
	fs.writeFile('input.rml', mappingfile.data, 'utf8', (err) => {
		if(err) throw err;
		console.log('Mapping file created.')

        //write source files, when last source file has been written, spawn mapper    
        var written = 0;    

        for(var i = 0; i < needed.length; i++) {
            var j = i; //async
            fs.writeFile(needed[i].filename, needed[i].data, 'utf8', (err) => {
                
                if(err) throw err;
                written = written + 1;
                if(written == needed.length) {                    
                    fs.readFile(needed[j].filename, 'utf8', (err, data) => { //using arrow function, this has no 'this'
                        
                        method.spawnRmlMapper(mappingfile._id, mappingfile.filename, triplenames, needed, (result) => {
                            rdf = result;
                            callback(rdf);
                        });
                    });
                    
                }
            });
        }  


            
            
    });


    
}

method.spawnRmlMapper = function(id, filename, triplenames, needed, callback) {

        var result;

        //TODO check command --> pick triple functionality

        //map the file
        const spawner = require('child_process');
        const spawn = spawner.exec(
        'java -jar ./workbench/domain/rdfgenerator/RML-Mapper.jar -m input.rml -o output.rdf [-tm ' + triplenames + ']');  
        
        //logging
        spawn.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });
        spawn.stderr.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        //save output.rdf and delete created files from directory
        spawn.on('close', () => {

            fs.readFile('./output.rdf', 'utf8', (err, data) => { //using arrow function, this has no 'this'
                if (err) throw err;
                    result = {
                        mapping_id: id,     
                        filename: filename + '_result',
                        data : data,
                        metadata : 'empty',
                        type : 'rdf',
                        id : mongoose.Types.ObjectId()
                    };

                
            
                fs.unlink('./output.rdf', function (err) {  //deleting temp files
                    if (err) throw err;
                });

                fs.unlink('./input.rml', function (err) {     // deleting temp files
                    if (err) throw err;
                });
                for(var i = 0; i < needed.length; i++) {
                    fs.unlink('./' + needed[i].filename, function (err) {   // deleting temp files
                        if (err) throw err;
                    });
                }
                
                
                callback(result);

            });
    });

}


//exporting module
module.exports = RDFGenerator;