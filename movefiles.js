const fs = require('fs');

const source = './ini_files/';
const dest = '../twrpg-updates/'

void (async () => {
    var files = fs.readdirSync(source);

    files.forEach(function(file){
        fs.rename(source + file, dest + file, function (err) {
            if (err) throw err;
            console.log('Move complete.');
        });
    });
})();