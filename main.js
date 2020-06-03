#!/usr/bin/env node
const argv = require('yargs').argv;
const cssom = require('cssom');
const fs = require('fs');
const convert = require('./convert');

if(!argv.o) {
    console.error("An output file must be specified");
    process.exit(1);
}
argv._.forEach(file => {
    const styleSheet = cssom.parse(fs.readFileSync(file).toString());
    try {
        convert.convert(styleSheet);
    } catch(e) {
        console.error("Error: could not convert file '" + file + "': ");
        console.error(e);
        process.exit(1);
    }
});

fs.writeFileSync(argv.o, convert.finalize());