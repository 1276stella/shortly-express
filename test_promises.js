var fs = require('fs');

var readFile = Promise.promisify(require("fs").readFile);

readFile("myfile.js", "utf8")