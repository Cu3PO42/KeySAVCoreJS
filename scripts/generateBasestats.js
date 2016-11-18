const path = require('path');
const fs = require('fs');

const pkhexPath = process.argv[2];
const bytePath = path.join(pkhexPath, 'PKHeX', 'Resources', 'byte');
const localPath = path.join(__dirname, '..');

function getDataBase(file, size) {
    const data = fs.readFileSync(path.join(bytePath, file), null);
    const res = [];
    for (let o = 0; o < data.length; o += size) {
        res.push(data.slice(o, o + size));
    }
    return res;
}

const gen6Data = getDataBase('personal_xy', 0x40);
const gen7Data = getDataBase('personal_sm', 0x54);

function getFormData(id, is7) {
    const pkmData = (is7 ? gen7Data : gen6Data)[id];
    const formIndex = pkmData.readUInt16LE(0x1C);
    const formCount = pkmData.readUInt8(0x20);
    return { index: formIndex, count: formCount };
}

function getIndex(id, data, form) {
    if (form == 0) {
        return id;
    }
    return data.readUInt16LE(0x1C) + form - 1;
}

function getBaseStats(id, is7) {
    const pkmBaseData = (is7 ? gen7Data : gen6Data)[id];
    const count = pkmBaseData.readUInt8(0x20);
    const res = [];
    for (let i = 0; i < count; ++i) {
        const stats = {};
        res.push(stats);

        const index = getIndex(id, pkmBaseData, i);
        const pkmData = (is7 ? gen7Data : gen6Data)[index];

        const baseStats = stats.baseStats = {};
        baseStats.hp = pkmData.readUInt8(0x0);
        baseStats.atk = pkmData.readUInt8(0x1);
        baseStats.def = pkmData.readUInt8(0x2);
        baseStats.spAtk = pkmData.readUInt8(0x4);
        baseStats.spDef = pkmData.readUInt8(0x5);
        baseStats.spe = pkmData.readUInt8(0x3);

        /*stats.abilities = [pkmData.getUint8(0x18), pkmData.getUint8(0x19), pkmData.getUint8(0x1A)];

        stats.baseFriendship = pkmData.getUint8(0x14);

        stats.genderRatio = pkmData.getUint8(0x12);*/

        stats.expGrowth = pkmData.readUInt8(0x15);
    }
    return res;
}

function generateAllBaseStats(is7) {
    const res = [];
    for (let i = 1; i < (is7 ? gen7Data : gen6Data).length; ++i) {
        res.push(getBaseStats(i, is7));
    }
    return res;
}

function generateAllBasestats6() {
    fs.writeFileSync(path.join(localPath, 'stats6.json'), JSON.stringify(generateAllBaseStats(false), null, 4), 'utf-8');
}

function generateAllBasestats7() {
    fs.writeFileSync(path.join(localPath, 'stats7.json'), JSON.stringify(generateAllBaseStats(true), null, 4), 'utf-8');
}

if (!module.parent) {
    generateAllBasestats6();
    generateAllBasestats7();
}