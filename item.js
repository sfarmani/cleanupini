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
                    prop["color"] = line.match(/\|(c[0-9a-z]{2})([0-9a-zA-Z]{6})([\w\W+\d]+)\|/i)[2];
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
            }
            else if (context === "description") {
                prop["description"] = line.match(/(.*)?/)[1].replace(/\|c[0-9a-z]{8}/g, '');
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
                if (line.match(/∴Damage ((\+|-)[\d\W]+)/)) stats["damage"] = line.match(/∴Damage ((\+|-)[\d\W]+)/)[1];
                if (line.match(/Auto-attack Damage ((\+|-)[\d\W]+)/)) stats["aadamagepercent"] = line.match(/Auto-attack Damage ((\+|-)[\d\W]+)/)[1];
                if (line.match(/Armor ((\+|-)[\d\W]+)/)) stats["armor"] = line.match(/Armor ((\+|-)[\d\W]+)/)[1];
                if (line.match(/Main Stat ((\+|-)[\d\W]+)/)) stats["mainstat"] = line.match(/Main Stat ((\+|-)[\d\W]+)/)[1];
                if (line.match(/All Stats ((\+|-)[\d\W]+)/)) stats["allstat"] = line.match(/All Stats ((\+|-)[\d\W]+)/)[1];
                if (line.match(/STR ((\+|-)[\d\W]+)/)) stats["str"] = line.match(/STR ((\+|-)[\d\W]+)/)[1];
                if (line.match(/AGI ((\+|-)[\d\W]+)/)) stats["agi"] = line.match(/AGI ((\+|-)[\d\W]+)/)[1];
                if (line.match(/INT ((\+|-)[\d\W]+)/)) stats["int"] = line.match(/INT ((\+|-)[\d\W]+)/)[1];
                if (line.match(/HP ((\+|-)[\d\W]+)/)) stats["hp"] = line.match(/HP ((\+|-)[\d\W]+)/)[1];
                if (line.match(/MP ((\+|-)[\d\W]+)/)) stats["mp"] = line.match(/MP ((\+|-)[\d\W]+)/)[1];
                if (line.match(/Attack Speed ((\+|-)[\d\W]+)/)) stats["attackspeedpercent"] = line.match(/Attack Speed ((\+|-)[\d\W]+)/)[1];
                if (line.match(/Movement Speed ((\+|-)(\b\d+(?:[\.,]\d+)?\b(?!(?:[\.,]\d+)|(?:\s*(?:%)))))/)) stats["movespeed"] = line.match(/Movement Speed ((\+|-)(\b\d+(?:[\.,]\d+)?\b(?!(?:[\.,]\d+)|(?:\s*(?:%)))))/)[1];
                if (line.match(/Movement Speed ((\+|-)\d+(\%))/)) stats["movespeedpercent"] = line.match(/Movement Speed ((\+|-)\d+(\%))/)[1];
                if (line.match(/Dodge Chance ((\+|-)[\d\W]+)/)) stats["dodgechancepercent"] = line.match(/Dodge Chance ((\+|-)[\d\W]+)/)[1];
                if (line.match(/Skill Damage ((\+|-)[\d\W]+)/)) stats["skilldamagepercent"] = line.match(/Skill Damage ((\+|-)[\d\W]+)/)[1];
                if (line.match(/Crit Chance ((\+|-)[\d\W]+)/)) stats["critchancepercent"] = line.match(/Crit Chance ((\+|-)[\d\W]+)/)[1];
                if (line.match(/Crit Multiplier ((\+|-)[\d\W]+)/)) stats["critmultiplier"] = line.match(/Crit Multiplier ((\+|-)[\d\W]+)/)[1];
                if (line.match(/Periodic Damage ((\+|-)[\d\W]+)/)) stats["periodicdamagepercent"] = line.match(/Periodic Damage ((\+|-)[\d\W]+)/)[1];
                if (line.match(/Magic Defense ((\+|-)[\d\W]+)/)) stats["mdpercent"] = line.match(/Magic Defense ((\+|-)[\d\W]+)/)[1];
                if (line.match(/Damage Reduction ((\+|-)[\d\W]+)/)) stats["drpercent"] = line.match(/Damage Reduction ((\+|-)[\d\W]+)/)[1];
                if (line.match(/Damage Taken ((\+|-)[\d\W]+)/)) stats["dtpercent"] = line.match(/Damage Taken ((\+|-)[\d\W]+)/)[1];
                if (line.match(/Damage Taken ((\+|-)(\b\d+(?:[\.,]\d+)?\b(?!(?:[\.,]\d+)|(?:\s*(?:%)))))/)) stats["dt"] = line.match(/Damage Taken ((\+|-)(\b\d+(?:[\.,]\d+)?\b(?!(?:[\.,]\d+)|(?:\s*(?:%)))))/)[1];
                if (line.match(/Damage Dealt ((\+|-)[\d\W]+)/)) stats["damagedealtpercent"] = line.match(/Damage Dealt ((\+|-)[\d\W]+)/)[1];
                if (line.match(/Healing Done ((\+|-)[\d\W]+)/)) stats["healingpercent"] = line.match(/Healing Done ((\+|-)[\d\W]+)/)[1];
                if (line.match(/Healing Received ((\+|-)[\d\W]+)/)) stats["healreceivedpercent"] = line.match(/Healing Received ((\+|-)[\d\W]+)/)[1];
                if (line.match(/HP regen ((\+|-)[\d\W]+)/)) stats["hpregen"] = line.match(/HP regen ((\+|-)[\d\W]+)/)[1];
                if (line.match(/MP regen ((\+|-)[\d\W]+)/)) stats["mpregen"] = line.match(/MP regen ((\+|-)[\d\W]+)/)[1];
                if (line.match(/(Water|Ice|Water\/Ice) Affinity ((\+|-)[\d\W]+)/)) stats["affinityiwpercent"] = line.match(/(Water|Ice|Water\/Ice) Affinity ((\+|-)[\d\W]+)/)[2];
                if (line.match(/Flame Affinity ((\+|-)[\d\W]+)/)) stats["affinityflamepercent"] = line.match(/Flame Affinity ((\+|-)[\d\W]+)/)[1];
                if (line.match(/Earth Affinity ((\+|-)[\d\W]+)/)) stats["affinityearthpercent"] = line.match(/Earth Affinity ((\+|-)[\d\W]+)/)[1];
                if (line.match(/Wind Affinity ((\+|-)[\d\W]+)/)) stats["affinitywlpercent"] = line.match(/Wind Affinity ((\+|-)[\d\W]+)/)[1];
                if (line.match(/Light Affinity ((\+|-)[\d\W]+)/)) stats["affinitylightpercent"] = line.match(/Light Affinity ((\+|-)[\d\W]+)/)[1];
                if (line.match(/Dark Affinity ((\+|-)[\d\W]+)/)) stats["affinitydarkpercent"] = line.match(/Dark Affinity ((\+|-)[\d\W]+)/)[1];
                if (line.match(/Revival Time ((\+|-)[\d\W]+)/)) stats["revivaltimepercent"] = line.match(/Revival Time ((\+|-)[\d\W]+)/)[1];
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