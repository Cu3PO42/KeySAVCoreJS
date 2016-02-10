var assert = require("assert");
var Pkx = require("../pkx").default;
var fs = require("fs");

function bufferToUint8Array(buf) {
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

var pkx = bufferToUint8Array(fs.readFileSync(__dirname + "/data/mudkip.pk6"));
var ekx = bufferToUint8Array(fs.readFileSync(__dirname + "/data/mudkip.ek6"));

describe("Pkx", function() {
    describe("#constructor()", function() {
        it("should extract all the information from a .pk6 file", function() {
            var res = {"ability":67,"abilityNum":2,"ball":4,"box":0,"chk":2484,"contestStatBeauty":0,"contestStatCool":0,"contestStatCute":0,"contestStatSheen":0,"contestStatSmart":0,"contestStatTough":0,"countryID":49,"data":[112,44,153,76,0,0,180,9,2,1,0,0,125,121,193,136,41,1,0,0,67,2,0,0,108,20,197,222,22,0,0,2,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,77,0,117,0,100,0,107,0,105,0,112,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,33,0,45,0,55,0,0,0,31,40,25,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,210,132,29,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,36,77,0,101,0,116,0,104,0,32,0,70,0,114,0,101,0,100,0,32,0,74,0,114,0,0,0,85,0,1,3,44,0,3,0,0,0,16,2,9,0,0,0,204,0,4,5,0,26,49,0,1,2,0,0,0,0],"dsregID":1,"ec":1285106800,"eggDate":[2000,0,1],"eggLocation":0,"eggMove1":0,"eggMove2":0,"eggMove3":0,"eggMove4":0,"encounterType":0,"esv":3242,"evAtk":2,"evDef":0,"evHp":0,"evSpAtk":0,"evSpDef":0,"evSpe":2,"exp":297,"form":0,"gameVersion":26,"gender":0,"heldItem":0,"hpType":7,"isEgg":false,"isFatefulEncounter":false,"isGhost":false,"isNick":false,"isShiny":false,"ivAtk":6,"ivDef":1,"ivHp":18,"ivSpAtk":1,"ivSpDef":6,"ivSpe":27,"levelMet":5,"markings":0,"metDate":[2016,1,9],"metLocation":204,"move1":33,"move1Pp":31,"move1Ppu":0,"move2":45,"move2Pp":40,"move2Ppu":0,"move3":55,"move3Pp":25,"move3Ppu":0,"move4":0,"move4Pp":0,"move4Ppu":0,"nature":22,"nickname":"Mudkip","notOT":"","ot":"Meth Fred Jr","otAffection":0,"otFriendship":85,"otGender":0,"otLang":2,"pid":3737457772,"pkrsDuration":0,"pkrsStrain":0,"regionID":0,"ribbonSet1":0,"ribbonSet2":0,"ribbonSet3":0,"ribbonSet4":0,"sid":35009,"slot":3,"species":258,"tid":31101,"tsv":3867};
            assert.deepEqual(JSON.parse(JSON.stringify(new Pkx(pkx, 0, 3, false))), res);
        });
    });

    describe("#encrypt()", function() {
        it("should properly encrypt a pk6 file", function() {
            assert.deepEqual(Pkx.encrypt(pkx), ekx);
        });
    });

    describe("#decrypt()", function() {
        it("should properly decrypt a ek6 file", function() {
            assert.deepEqual(Pkx.decrypt(ekx), pkx);
        });
    });

    describe("#verifyChk()", function() {
        it("should accept a valid pk6", function() {
            assert.equal(Pkx.verifyChk(pkx), true);
        });

        it("should reject a corrupted pk6", function() {
            var alt = pkx[10];
            pkx[10] = 2;
            assert.equal(Pkx.verifyChk(pkx), false);
            pkx[10] = alt;
        });
    });

    describe("#fixChk()", function() {
        it("should fix a corrupted checksum", function() {
            pkx[5] = 0;
            pkx[6] = 0;
            Pkx.fixChk(pkx);
            assert.equal(Pkx.verifyChk(pkx), true);
        });
    });
});
