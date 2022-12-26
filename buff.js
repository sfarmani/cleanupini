const fs = require('fs');
const readline = require('readline');
const FileHound = require('filehound');
const _ = require('underscore');

const path = './ini_files';

void (async () => {
    const ini_files = FileHound.create().paths(path).ext('ini').find();
    if (ini_files.length == 0) return;

    ini_files.each(async function (file) {
        if (!file.match(/buff/)) return;

        var str = []; var prop = {}; var ml_context; var description = [];

        const rl = readline.createInterface({
            input: fs.createReadStream(file),
            crlfDelay: Infinity,
        });

        rl.on('line', function (line) {
            if (line.match(/^\[[a-zA-Z0-9]{4}\]$/i)) {
                prop["id"] = line.replace(/\[|\]/g, '');
            }
            else if (line.match(/Name = |Bufftip = /)) {
                if (line.match(/\|c[0-9a-z]{2}/i)) {
                    prop["color"] = line.match(/\|(c[0-9a-z]{2})([0-9a-zA-Z]{6})/)[2];
                    prop["name"] = line.match(/\|(c[0-9a-z]{8})(.*)?(\|r)/)[2];
                }
                else prop["name"] = line.match(/\"(.*)?\"/)[1];
            }
            else if (line.match(/^Buffart =/)) {
                prop["icon"] = line.match(/= \"(.*)?\"/)[1];
            }
            else if (line.match(/Buffubertip = /) || ml_context === "description") {
                if (line.match(/Buffubertip = \"\"/)) return;
                if (line.match(/= {|= \[=\[/)) ml_context = "description";
                else if (ml_context === "description") {
                    if (!line) return;
                    if (line.match(/-- /)) ml_context = "";
                    else description.push(line.replace(/\|c[0-9a-z]{8}|\]=\]|\[=\[|\|r|\}|∴/g, ''));
                }
                else {
                    description.push(line.match(/= \"(.*)?\"/)[1]);
                    ml_context = "";
                }
            }

            if (!line) {
                prop["description"] = _.uniq(description);
                if (!prop["description"].length) delete prop["description"];
                str.push(prop);
                description = [];
                prop = {};
            }
        });


        await new Promise((res) => rl.once('close', res));

        fs.writeFileSync(file.replace(/.ini/, '.json'), JSON.stringify(str, null, 4));
    });
})();

function convertFloat(str) {
    return +(str) ? +(str) : str;
}