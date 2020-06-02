#!/usr/bin/env node
const argv = require('yargs').argv;
const cssom = require('cssom');
const fs = require('fs');
const convert = require('./convert');
argv._.forEach(file => {
    const styleSheet = cssom.parse(fs.readFileSync(file).toString());
    try {
        convert.convert(styleSheet);
    } catch(e) {
        console.error("Error: could not conert file '" + file + "'");
        process.exit(1);
    }
    
});

convert.finalize();