const fs = require('fs');
const readline = require('readline');
const FileHound = require('filehound');
const _ = require('underscore');

const path = './ini_files';

const stat_regex = /(Damage |STR |AGI |INT |Auto-attack Damage |HP |MP |Armor |Main Stat |All Stats |Attack Speed |Movement Speed |Dodge Chance |Skill Damage |Crit Chance |Crit Multiplier |Periodic Damage |Magic Defense |Damage Reduction |Damage Taken |Healing Done |Healing Received |HP regen |MP regen |Affinity |EXP Gain |Revival Time )(\+|-)/i

void (async () => {
    const ini_files = FileHound.create().paths(path).ext('ini').find();
    if (ini_files.length == 0) return;

    ini_files.each(async function (file) {
        if (!file.match(/item/)) return;

        var str = []; var prop = {}; var stats = {}; var context;

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
                    prop["name"] = line.match(/\|(c[0-9a-z]{2})([0-9a-zA-Z]{6})([\w\W+\d]+)\|/i)[3];
                    // prop["color"] = line.match(/\|(c[0-9a-z]{2})([0-9a-zA-Z]{6})([\w\W+\d]+)\|/i)[2].toUpperCase();
                }
                else prop["name"] = line.match(/\"(.*)?\"/)[1];
            }
            else if (line.match(/\[(Epic|Normal|Magic|Rare)\]/)) {
                prop["rank"] = line.match(/(\[(Epic|Normal|Magic|Rare)\])/)[1];
            }
            else if (line.match(/^Art =/)) {
                prop["icon"] = line.match(/= \"(.*)?\"/)[1];
            }
            else if (line.match(/\|r Grade /)) {
                context = "description";
                if (line.match(/Deltirama/)) prop["grade"] = 1;
                if (line.match(/Neptinos/)) prop["grade"] = 2;
                if (line.match(/Gnosis/)) prop["grade"] = 3;
                if (line.match(/Alteia/)) prop["grade"] = 4;
                if (line.match(/Arcana/)) prop["grade"] = 5;

                prop["type"] = line.match(/Grade (.*)? -/)[1];
                prop["color"] = line.match(/\|(c[0-9a-z]{2})([0-9a-zA-Z]{6})([\w\W+\d]+)\|/i)[2].toUpperCase();
            }
            else if (context === "description") {
                prop["description"] = line.match(/(.*)?/)[1].replace(/\|c[0-9a-z]{8}/ig, '');
                context = "";
            }
            else if (line.match(/\|c0040e0d0∴|\|c00adff2f◎/)) {
                if (!line.match(/Lv\./i)) {
                    if (!stats["activepassive"]) stats["activepassive"] = [line.match(/(\|c[0-9a-z]{8}(∴|◎)(\|c[0-9a-z]{8})?)?(.*)?/)[4]];
                    else stats["activepassive"].push(line.match(/(\|c[0-9a-z]{8}(∴|◎)(\|c[0-9a-z]{8})?)?(.*)?/)[4]);
                }
            }
            else if (line.match(/Lv\./i)) {
                prop["level"] = line.match(/Lv\.\s?(\d+)/i)[1];
            }
            else if (line.match(stat_regex)) {
                if (line.match(/∴(Attack Damage|Damage) ((\+|-)[\d\W]+)/)) stats["damage"] = parseToNumber(line.match(/∴(Attack Damage|Damage) ((\+|-)[\d\W]+)/)[2]);
                if (line.match(/Auto-attack Damage ((\+|-)[\d\W]+)/)) stats["aadamagepercent"] = parseToPercent(line.match(/Auto-attack Damage ((\+|-)[\d\W]+)/)[1]);
                if (line.match(/Armor ((\+|-)[\d\W]+)/)) stats["armor"] = parseToNumber(line.match(/Armor ((\+|-)[\d\W]+)/)[1]);
                if (line.match(/Main Stat ((\+|-)[\d\W]+)/)) stats["mainstat"] = parseToNumber(line.match(/Main Stat ((\+|-)[\d\W]+)/)[1]);
                if (line.match(/All Stats ((\+|-)[\d\W]+)/)) stats["allstat"] = parseToNumber(line.match(/All Stats ((\+|-)[\d\W]+)/)[1]);
                if (line.match(/STR ((\+|-)[\d\W]+)/)) stats["str"] = parseToNumber(line.match(/STR ((\+|-)[\d\W]+)/)[1]);
                if (line.match(/AGI ((\+|-)[\d\W]+)/)) stats["agi"] = parseToNumber(line.match(/AGI ((\+|-)[\d\W]+)/)[1]);
                if (line.match(/INT ((\+|-)[\d\W]+)/)) stats["int"] = parseToNumber(line.match(/INT ((\+|-)[\d\W]+)/)[1]);
                if (line.match(/HP ((\+|-)[\d\W]+)/)) stats["hp"] = parseToNumber(line.match(/HP ((\+|-)[\d\W]+)/)[1]);
                if (line.match(/MP ((\+|-)[\d\W]+)/)) stats["mp"] = parseToNumber(line.match(/MP ((\+|-)[\d\W]+)/)[1]);
                if (line.match(/Attack Speed ((\+|-)[\d\W]+)/)) stats["attackspeedpercent"] = parseToPercent(line.match(/Attack Speed ((\+|-)[\d\W]+)/)[1]);
                if (line.match(/Movement Speed ((\+|-)(\b\d+(?:[\.,]\d+)?\b(?!(?:[\.,]\d+)|(?:\s*(?:%)))))/)) stats["movespeed"] = parseToNumber(line.match(/Movement Speed ((\+|-)(\b\d+(?:[\.,]\d+)?\b(?!(?:[\.,]\d+)|(?:\s*(?:%)))))/)[1]);
                if (line.match(/Movement Speed ((\+|-)\d+(\%))/)) stats["movespeedpercent"] = parseToPercent(line.match(/Movement Speed ((\+|-)\d+(\%))/)[1]);
                if (line.match(/Dodge Chance ((\+|-)[\d\W]+)/)) stats["dodgechancepercent"] = parseToPercent(line.match(/Dodge Chance ((\+|-)[\d\W]+)/)[1]);
                if (line.match(/Skill Damage ((\+|-)[\d\W]+)/)) stats["skilldamagepercent"] = parseToPercent(line.match(/Skill Damage ((\+|-)[\d\W]+)/)[1]);
                if (line.match(/Crit Chance ((\+|-)[\d\W]+)/)) stats["critchancepercent"] = parseToPercent(line.match(/Crit Chance ((\+|-)[\d\W]+)/)[1]);
                if (line.match(/Crit Multiplier ((\+|-)[\d\W]+)/)) stats["critmultiplier"] = parseToNumber(line.match(/Crit Multiplier ((\+|-)[\d\W]+)/)[1]);
                if (line.match(/Periodic Damage ((\+|-)[\d\W]+)/)) stats["periodicdamagepercent"] = parseToPercent(line.match(/Periodic Damage ((\+|-)[\d\W]+)/)[1]);
                if (line.match(/Magic Defense ((\+|-)[\d\W]+)/)) stats["mdpercent"] = parseToPercent(line.match(/Magic Defense ((\+|-)[\d\W]+)/)[1]);
                if (line.match(/Damage Reduction ((\+|-)[\d\W]+)/)) stats["drpercent"] = parseToPercent(line.match(/Damage Reduction ((\+|-)[\d\W]+)/)[1]);
                if (line.match(/Damage Taken ((\+|-)[\d\W]+)/)) stats["dtpercent"] = parseToPercent(line.match(/Damage Taken ((\+|-)[\d\W]+)/)[1]);
                if (line.match(/Damage Taken ((\+|-)(\b\d+(?:[\.,]\d+)?\b(?!(?:[\.,]\d+)|(?:\s*(?:%)))))/)) stats["dt"] = parseToNumber(line.match(/Damage Taken ((\+|-)(\b\d+(?:[\.,]\d+)?\b(?!(?:[\.,]\d+)|(?:\s*(?:%)))))/)[1]);
                if (line.match(/Damage Dealt ((\+|-)[\d\W]+)/)) stats["damagedealtpercent"] = parseToPercent(line.match(/Damage Dealt ((\+|-)[\d\W]+)/)[1]);
                if (line.match(/Healing Done ((\+|-)[\d\W]+)/)) stats["healingpercent"] = parseToPercent(line.match(/Healing Done ((\+|-)[\d\W]+)/)[1]);
                if (line.match(/Healing Received ((\+|-)[\d\W]+)/)) stats["healreceivedpercent"] = parseToPercent(line.match(/Healing Received ((\+|-)[\d\W]+)/)[1]);
                if (line.match(/HP Regen ((\+|-)[\d\W]+)/)) stats["hpregen"] = parseToNumber(line.match(/HP Regen ((\+|-)[\d\W]+)/)[1]);
                if (line.match(/MP Regen ((\+|-)[\d\W]+)/)) stats["mpregen"] = parseToNumber(line.match(/MP Regen ((\+|-)[\d\W]+)/)[1]);
                if (line.match(/(Water|Ice|Water\/Ice) Affinity ((\+|-)[\d\W]+)/)) stats["affinityiwpercent"] = parseToPercent(line.match(/(Water|Ice|Water\/Ice) Affinity ((\+|-)[\d\W]+)/)[2]);
                if (line.match(/Flame Affinity ((\+|-)[\d\W]+)/)) stats["affinityflamepercent"] = parseToPercent(line.match(/Flame Affinity ((\+|-)[\d\W]+)/)[1]);
                if (line.match(/Earth Affinity ((\+|-)[\d\W]+)/)) stats["affinityearthpercent"] = parseToPercent(line.match(/Earth Affinity ((\+|-)[\d\W]+)/)[1]);
                if (line.match(/Wind Affinity ((\+|-)[\d\W]+)/)) stats["affinitywlpercent"] = parseToPercent(line.match(/Wind Affinity ((\+|-)[\d\W]+)/)[1]);
                if (line.match(/Light Affinity ((\+|-)[\d\W]+)/)) stats["affinitylightpercent"] = parseToPercent(line.match(/Light Affinity ((\+|-)[\d\W]+)/)[1]);
                if (line.match(/(Dark|Darkness) Affinity ((\+|-)[\d\W]+)/)) stats["affinitydarkpercent"] = parseToPercent(line.match(/(Dark|Darkness) Affinity ((\+|-)[\d\W]+)/)[2]);
                if (line.match(/Revival Time ((\+|-)[\d\W]+)/)) stats["revivaltimepercent"] = parseToPercent(line.match(/Revival Time ((\+|-)[\d\W]+)/)[1]);
            }

            if (!line) {
                stats["activepassive"] = _.uniq(stats["activepassive"]);
                if (!stats["activepassive"].length) delete stats["activepassive"];
                prop["stats"] = stats;
                str.push(prop);
                prop = {}; stats = {};
            }
        });

        await new Promise((res) => rl.once('close', res));

        fs.writeFileSync(file.replace(/.ini/, '.json'), JSON.stringify(str, null, 4));
    });
})();

function parseToNumber(str) {
    return parseFloat(str.replace(/\+/, ""));
}

function parseToPercent(str) {
    return parseFloat(str.replace(/\+/, "")) / 100;
}