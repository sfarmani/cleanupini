const fs = require('fs');
const readline = require('readline');
const FileHound = require('filehound');
const _ = require('underscore');

const path = './ini_files';

void (async () => {
    const ini_files = FileHound.create().paths(path).ext('ini').find();
    if (ini_files.length == 0) return;

    ini_files.each(async function (file) {
        if (!file.match(/ability/)) return;

        var str = []; var prop = {}; var ml_context; var description = [];

        const rl = readline.createInterface({
            input: fs.createReadStream(file),
            crlfDelay: Infinity,
        });

        rl.on('line', function (line) {
            if (line.match(/^\[[a-zA-Z0-9]{4}\]$/i)) {
                prop["id"] = line.replace(/\[|\]/g, '');
            }
            else if (line.match(/Name = /)) {
                prop["name"] = line.match(/\"(.*)?\"/)[1];
            }
            else if (line.match(/Cost =/)) {
                prop["mana_cost"] = convertFloat(line.match(/= (.*)?/)[1]);
            }
            else if (line.match(/Cool =/)) {
                prop["cooldown"] = convertFloat(line.match(/= (.*)?/)[1]);
            }
            else if (line.match(/^Dur =/)) {
                prop["duration"] = convertFloat(line.match(/= (.*)?/)[1]);
            }
            else if (line.match(/^Rng =/)) {
                prop["area_of_effect"] = convertFloat(line.match(/= (.*)?/)[1]);
            }
            else if (line.match(/^Art =/)) {
                prop["icon"] = line.match(/= \"(.*)?\"/)[1];
            }
            else if (line.match(/^Hotkey =/)) {
                prop["hotkey"] = line.match(/= \"(.*)?\"/)[1];
            }
            else if (line.match(/BuffID =/) || ml_context === "buff_id") {
                if (line.match(/= {/)) ml_context = "buff_id";
                else if (ml_context === "buff_id") {
                    prop[ml_context] = line.match(/\"(.*)?\"/)[1];
                    ml_context = "";
                }
                else prop["buff_id"] = line.match(/\"(.*)?\"/)[1];
            }
            else if (line.match(/^Tip =/)) {
                if (!line.match(/\|c[0-9a-z]{2}/i)) return;

                if (line.match(/= {/)) ml_context = "color";
                else if (ml_context === "color") {
                    prop[ml_context] = line.match(/\|(c[0-9a-z]{2})([0-9a-zA-Z]{6})/)[2];
                    ml_context = "";
                }
                else prop["color"] = line.match(/\|(c[0-9a-z]{2})([0-9a-zA-Z]{6})/)[2];
            }
            else if (line.match(/-- Armor Bonus/) || ["armor_bonus"].includes(ml_context)) {
                if (line.match(/-- /)) ml_context = "armor_bonus";
                else {
                    prop[ml_context] = convertFloat(line.match(/= (.*)?/)[1]);
                    ml_context = "";
                }
            }
            else if (line.match(/-- Chance to Critical Strike/) || ["crit_chance"].includes(ml_context)) {
                if (line.match(/-- /)) ml_context = "crit_chance";
                else {
                    prop[ml_context] = convertFloat(line.match(/= (.*)?/)[1]);
                    ml_context = "";
                }
            }
            else if (line.match(/-- Damage Multiplier/) || ["crit_multiplier"].includes(ml_context)) {
                if (line.match(/-- /)) ml_context = "crit_multiplier";
                else {
                    prop[ml_context] = convertFloat(line.match(/= (.*)?/)[1]);
                    ml_context = "";
                }
            }
            else if (line.match(/-- Chance to Evade/) || ["evade_chance"].includes(ml_context)) {
                if (line.match(/-- /)) ml_context = "evade_chance";
                else {
                    prop[ml_context] = convertFloat(line.match(/= (.*)?/)[1]);
                    ml_context = "";
                }
            }
            else if (line.match(/-- Attack Speed/) || ["attack_speed_factor", "attack_speed_increase", "attack_speed_reduction"].includes(ml_context)) {
                if (line.match(/-- /)) {
                    if (line.match(/Increase (%)/)) ml_context = "attack_speed_increase";
                    else if (line.match(/Reduction (%)/)) ml_context = "attack_speed_reduction";
                    else ml_context = "attack_speed_factor";
                }
                else {
                    prop[ml_context] = line.match(/= (.*)?/)[1];
                    ml_context = "";
                }
            }
            else if (line.match(/-- Movement Speed/) || ["movement_speed_factor", "movement_speed_increase", "movement_speed_reduction"].includes(ml_context)) {
                if (line.match(/-- /)) {
                    if (line.match(/Increase (%)/)) ml_context = "movement_speed_increase";
                    else if (line.match(/Reduction (%)/)) ml_context = "movement_speed_reduction";
                    else ml_context = "movement_speed_factor";
                }
                else {
                    prop[ml_context] = line.match(/= (.*)?/)[1];
                    ml_context = "";
                }
            }
            else if (line.match(/-- Chance to Critical Strike/) || ["crit_chance"].includes(ml_context)) {
                if (line.match(/-- /)) ml_context = "crit_chance";
                else {
                    prop[ml_context] = convertFloat(line.match(/= (.*)?/)[1]);
                    ml_context = "";
                }
            }
            else if (line.match(/Ubertip =/) || ml_context === "description") {
                if (line.match(/Ubertip = \"\"/)) return;
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