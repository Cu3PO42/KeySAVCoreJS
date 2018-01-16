var assert = require("assert");
var PkBase = require("../lib/pkbase").default;
var Pk6 = require("../lib/pk6").default;
var Pk7 = require("../lib/pk7").default;
var fs = require("fs");

function bufferToUint8Array(buf) {
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

var pk6 = bufferToUint8Array(fs.readFileSync(__dirname + "/data/mudkip.pk6"));
var ek6 = bufferToUint8Array(fs.readFileSync(__dirname + "/data/mudkip.ek6"));

describe("Pk6", function() {
    describe("#constructor()", function() {
        it("should extract all the information from a .pk6 file", function() {
            var res = {"data":[112,44,153,76,0,0,180,9,2,1,0,0,125,121,193,136,41,1,0,0,67,2,0,0,108,20,197,222,22,0,0,2,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,77,0,117,0,100,0,107,0,105,0,112,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,33,0,45,0,55,0,0,0,31,40,25,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,210,132,29,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,36,77,0,101,0,116,0,104,0,32,0,70,0,114,0,101,0,100,0,32,0,74,0,114,0,0,0,85,0,1,3,44,0,3,0,0,0,16,2,9,0,0,0,204,0,4,5,0,26,49,0,1,2,0,0,0,0],"box":0,"slot":3,"isGhost":false,"ec":1285106800,"chk":2484,"species":258,"heldItem":0,"tid":31101,"sid":35009,"exp":297,"ability":67,"abilityNum":2,"trainingBagHitsRemaining":0,"pid":3737457772,"nature":22,"isFatefulEncounter":false,"gender":0,"form":0,"evHp":0,"evAtk":2,"evDef":0,"evSpAtk":0,"evSpDef":0,"evSpe":2,"contestStatCool":0,"contestStatBeauty":0,"contestStatCute":0,"contestStatSmart":0,"contestStatTough":0,"contestStatSheen":0,"markings":0,"pkrsStrain":0,"pkrsDuration":0,"ribbonSet1":0,"ribbonSet2":0,"ribbonSet3":0,"ribbonSet4":0,"contestMemoryRibbonCount":0,"battleMemoryRibbonCount":0,"nickname":"Mudkip","move1":33,"move2":45,"move3":55,"move4":0,"move1Pp":31,"move2Pp":40,"move3Pp":25,"move4Pp":0,"move1Ppu":0,"move2Ppu":0,"move3Ppu":0,"move4Ppu":0,"eggMove1":0,"eggMove2":0,"eggMove3":0,"eggMove4":0,"ivHp":18,"ivAtk":6,"ivDef":1,"ivSpe":27,"ivSpAtk":1,"ivSpDef":6,"isEgg":false,"isNick":false,"notOT":"","notOtGender":false,"currentHandler":false,"notOtFriendship":0,"notOtAffection":0,"geoRegion1":0,"geoCountry1":0,"geoRegion2":0,"geoCountry2":0,"geoRegion3":0,"geoCountry3":0,"geoRegion4":0,"geoCountry4":0,"geoRegion5":0,"geoCountry5":0,"fullness":0,"enjoyment":36,"ot":"Meth Fred Jr","otFriendship":85,"otAffection":0,"eggDate":[2000,0,1],"metDate":[2016,1,9],"eggLocation":0,"metLocation":204,"ball":4,"levelMet":5,"otGender":false,"encounterType":0,"gameVersion":26,"countryID":49,"regionID":0,"ribbonData":[0,0,0,0,0,0,0,0],"superTrainingFlag":0,"dsregID":1,"otLang":2,"hpType":7,"tsv":3867,"esv":3242,"isShiny":false,"version":6};
            assert.deepEqual(JSON.parse(JSON.stringify(new Pk6(pk6, 0, 3, false))), res);
        });
    });

    describe("#encrypt()", function() {
        it("should properly encrypt a pk6 file", function() {
            assert.deepEqual(new Buffer(PkBase.encrypt(pk6)), new Buffer(ek6));
        });
    });

    describe("#decrypt()", function() {
        it("should properly decrypt a ek6 file", function() {
            assert.deepEqual(new Buffer(PkBase.decrypt(ek6)), new Buffer(pk6));
        });
    });

    describe("#verifyChk()", function() {
        it("should accept a valid pk6", function() {
            assert.equal(PkBase.verifyChk(pk6), true);
        });

        it("should reject a corrupted pk6", function() {
            var alt = pk6[10];
            pk6[10] = 2;
            assert.equal(PkBase.verifyChk(pk6), false);
            pk6[10] = alt;
        });
    });

    describe("#fixChk()", function() {
        it("should fix a corrupted checksum", function() {
            pk6[5] = 0;
            pk6[6] = 0;
            PkBase.fixChk(pk6);
            assert.equal(PkBase.verifyChk(pk6), true);
        });
    });
});
