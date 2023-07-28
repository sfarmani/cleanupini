const fs = require('fs');
const readline = require('readline');
const FileHound = require('filehound');
const _ = require('underscore');

const path = './ini_files';

void (async () => {
    const ini_files = FileHound.create().paths(path).ext('ini').find();
    if (ini_files.length == 0) return;

    ini_files.each(async function (file) {
        if (!file.match(/unit/)) return;

        var str = []; var prop = {}; var description = [];

        const rl = readline.createInterface({
            input: fs.createReadStream(file),
            crlfDelay: Infinity,
        });

        rl.on('line', function (line) {
            if (line.match(/^\[[a-zA-Z0-9]{4}\]$/i)) {
                prop["id"] = line.replace(/\[|\]/g, '');
            }
            else if (line.match(/Name = /)) {
                if (line.match(/\|c[0-9a-z]{2}/i)) {
                    prop["color"] = line.match(/\|(c[0-9a-zA-Z]{2})([0-9a-zA-Z]{6})/)[2];
                    prop["name"] = line.match(/\"(.*)?\"/)[1].replace(/\|c[0-9a-zA-Z]{8}|\|r/g, "");
                }
                else prop["name"] = line.match(/\"(.*)?\"/)[1];
            }
            else if (line.match(/^AGI =/)) {
                prop["starting_agi"] = convertFloat(line.match(/= (.*)?/)[1]);
            }
            else if (line.match(/^INT =/)) {
                prop["starting_int"] = convertFloat(line.match(/= (.*)?/)[1]);
            }
            else if (line.match(/^STR =/)) {
                prop["starting_str"] = convertFloat(line.match(/= (.*)?/)[1]);
            }
            else if (line.match(/^HP =/)) {
                prop["starting_hp"] = convertFloat(line.match(/= (.*)?/)[1]);
            }
            else if (line.match(/^level =/)) {
                prop["level"] = convertFloat(line.match(/= (.*)?/)[1]);
            }
            else if (line.match(/^Primary =/)) {
                prop["primary_stat"] = line.match(/= \"(.*)?\"/)[1];
            }
            else if (line.match(/Propername =/)) {
                prop["hero_name"] = line.match(/= \"(.*)?\"/)[1];
            }
            else if (line.match(/^Art =/)) {
                prop["icon"] = line.match(/= \"(.*)?\"/)[1];
            }
            else if (line.match(/^heroAbilList =/)) {
                prop["ability_list"] = line.match(/= \"(.*)?\"/)[1];
            }
            else if (line.match(/^rangeN1 =/)) {
                prop["attack_range"] = convertFloat(line.match(/= (.*)?/)[1]);
            }
            else if (line.match(/^regenHP =/)) {
                prop["regen_hp"] = convertFloat(line.match(/= (.*)?/)[1]);
            }
            else if (line.match(/^regenMana =/)) {
                prop["regen_mp"] = convertFloat(line.match(/= (.*)?/)[1]);
            }

            if (!line) {
                prop["description"] = _.uniq(description);
                if (!prop["description"].length) delete prop["description"];
                str.push(prop);
                description = []; prop = {};
            }
        });


        await new Promise((res) => rl.once('close', res));

        fs.writeFileSync(file.replace(/.ini/, '.json'), JSON.stringify(str, null, 4));
    });
})();

function convertFloat(str) {
    return +(str) ? +(str) : str;
}