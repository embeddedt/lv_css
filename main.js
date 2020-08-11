#!/usr/bin/env node
const argv = require('yargs')
    .usage('Usage: $0 [optional args] -o <output code file> <input CSS file>')
    .option('outfile', {
        alias: 'o',
        type: 'string',
        nargs: 1,
        demandOption: "Must specify output file",
        description: 'File to write generated code to',
    })
    .option('watch', {
        alias: 'w',
        type: 'boolean',
        description: 'Enable daemon mode (watches for changes to CSS)'
    })
    .option('lang', {
        description: 'Output code language',
        alias: 'l',
        type: 'string',
        choices: [ "c", "micropython" ],
        default: "c"
    })
    .demandCommand(1, "Must specify input file")
    .argv;
const fs = require('fs');
const convert = require('./convert');


var file = argv._[0];

const doConvert = () => {
    console.log("Converting...");
    convert.convert(fs.readFileSync(file).toString(), argv.lang);
    fs.writeFileSync(argv.outfile, convert.finalize(argv.lang));
    console.log("Finished converting.");
};
if(argv.watch) {
    doConvert();
    const chokidar = require('chokidar');
    const watcher = chokidar.watch(file, {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true
    });
    watcher.on('ready', () => console.log('Ready for changes'));
    watcher.on('change', () => {
        doConvert();
    });
} else {
    try {
        doConvert();
    } catch(e) {
        console.error("Error: could not convert file '" + file + "': ");
        console.error(e);
        process.exit(1);
    }
}
