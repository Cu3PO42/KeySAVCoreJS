using System;
using JS;

namespace KeySAVCore.Structures
{
    public struct PKX
    {
        public readonly uint 
            ec, pid, exp, 
            evHp, evAtk, evDef, evSpAtk, evSpDef, evSpe,
            ivHp, ivAtk, ivDef, ivSpe, ivSpAtk, ivSpDef,
            contestStatCool, contestStatBeauty, contestStatCute, contestStatSmart, contestStatTough, contestStatSheen,
            markings, hpType;

        public readonly string
            nickname, notOT, ot;

        public readonly int
            pkrsStrain, pkrsDuration,
            levelMet, otGender;

        public readonly bool
            isEgg, isNick, isShiny, isGhost, isFatefulEncounter;

        public readonly ushort
            ability, abilityNum, nature,
            species, heldItem, tid, sid, tsv, esv,
            move1, move2, move3, move4,
            move1Pp, move2Pp, move3Pp, move4Pp,
            move1Ppu, move2Ppu, move3Ppu, move4Ppu,
            eggMove1, eggMove2, eggMove3, eggMove4,
            chk,

            otFriendship, otAffection,
            eggLocation, metLocation,
            ball, encounterType,
            gamevers, countryID, regionID, dsregID, otLang;

        public readonly short 
            box, slot;

        public readonly byte
            form, gender;

        public readonly Date
            metDate, eggDate;

        public PKX(Uint8Array pkx, short box, short slot, bool isghost)
        {
            this.box = box;
            this.slot = slot;

            this.isGhost = isghost;

            nickname = "";
            notOT = "";
            ot = "";
            ec = BitConverter.ToUInt32(pkx, 0);
            chk = BitConverter.ToUInt16(pkx, 6);
            species = BitConverter.ToUInt16(pkx, 0x08);
            heldItem = BitConverter.ToUInt16(pkx, 0x0A);
            tid = BitConverter.ToUInt16(pkx, 0x0C);
            sid = BitConverter.ToUInt16(pkx, 0x0E);
            exp = BitConverter.ToUInt32(pkx, 0x10);
            ability = pkx[0x14];
            abilityNum = pkx[0x15];
            // 0x16, 0x17 - unknown
            pid = BitConverter.ToUInt32(pkx, 0x18);
            nature = pkx[0x1C];
            isFatefulEncounter = (pkx[0x1D] & 1) == 1;
            gender = (byte)((pkx[0x1D] >> 1) & 0x3);
            form = (byte)(pkx[0x1D] >> 3);
            evHp = pkx[0x1E];
            evAtk = pkx[0x1F];
            evDef = pkx[0x20];
            evSpAtk = pkx[0x22];
            evSpDef = pkx[0x23];
            evSpe = pkx[0x21];
            contestStatCool = pkx[0x24];
            contestStatBeauty = pkx[0x25];
            contestStatCute = pkx[0x26];
            contestStatSmart = pkx[0x27];
            contestStatTough = pkx[0x28];
            contestStatSheen = pkx[0x29];
            markings = pkx[0x2A];
            pkrsStrain = pkx[0x2B] >> 4;
            pkrsDuration = pkx[0x2B] % 0x10;

            // Block B
            nickname = Encoding.Unicode.GetString(pkx, 0x40, 24).TrimCString();
            // 0x58, 0x59 - unused
            move1 = BitConverter.ToUInt16(pkx, 0x5A);
            move2 = BitConverter.ToUInt16(pkx, 0x5C);
            move3 = BitConverter.ToUInt16(pkx, 0x5E);
            move4 = BitConverter.ToUInt16(pkx, 0x60);
            move1Pp = pkx[0x62];
            move2Pp = pkx[0x63];
            move3Pp = pkx[0x64];
            move4Pp = pkx[0x65];
            move1Ppu = pkx[0x66];
            move2Ppu = pkx[0x67];
            move3Ppu = pkx[0x68];
            move4Ppu = pkx[0x69];
            eggMove1 = BitConverter.ToUInt16(pkx, 0x6A);
            eggMove2 = BitConverter.ToUInt16(pkx, 0x6C);
            eggMove3 = BitConverter.ToUInt16(pkx, 0x6E);
            eggMove4 = BitConverter.ToUInt16(pkx, 0x70);

            // 0x72 - Super Training Flag - Passed with pkx to new form

            // 0x73 - unused/unknown
            uint IV32 = BitConverter.ToUInt32(pkx, 0x74);
            ivHp = IV32 & 0x1F;
            ivAtk = (IV32 >> 5) & 0x1F;
            ivDef = (IV32 >> 10) & 0x1F;
            ivSpe = (IV32 >> 15) & 0x1F;
            ivSpAtk = (IV32 >> 20) & 0x1F;
            ivSpDef = (IV32 >> 25) & 0x1F;
            isEgg = ((IV32 >> 30) & 1) != 0;
            isNick = ((IV32 >> 31)) != 0;

            // Block C
            notOT = Encoding.Unicode.GetString(pkx, 0x78, 24).TrimCString();
            bool notOTG = (pkx[0x92]) != 0;
            // Memory Editor edits everything else with pkx in a new form

            // Block D
            ot = Encoding.Unicode.GetString(pkx, 0xB0, 24).TrimCString();
            // 0xC8, 0xC9 - unused
            otFriendship = pkx[0xCA];
            otAffection = pkx[0xCB]; // Handled by Memory Editor
            // 0xCC, 0xCD, 0xCE, 0xCF, 0xD0
            eggDate = new Date(pkx[0xD1], pkx[0xD2], pkx[0xD3]);
            metDate = new Date(pkx[0xD4], pkx[0xD5], pkx[0xD6]);
            // 0xD7 - unused
            eggLocation = BitConverter.ToUInt16(pkx, 0xD8);
            metLocation = BitConverter.ToUInt16(pkx, 0xDA);
            ball = pkx[0xDC];
            levelMet = pkx[0xDD] & 0x7F;
            otGender = (pkx[0xDD]) >> 7;
            encounterType = pkx[0xDE];
            gamevers = pkx[0xDF];
            countryID = pkx[0xE0];
            regionID = pkx[0xE1];
            dsregID = pkx[0xE2];
            otLang = pkx[0xE3];

            hpType = (15 * ((ivHp & 1) + 2 * (ivAtk & 1) + 4 * (ivDef & 1) + 8 * (ivSpe & 1) + 16 * (ivSpAtk & 1) + 32 * (ivSpDef & 1))) / 63 + 1;

            tsv = (ushort)((tid ^ sid) >> 4);
            esv = (ushort)(((pid >> 16) ^ (pid & 0xFFFF)) >> 4);

            isShiny = (tsv == esv);
        }

        // Code by Kaphotics
        private static Uint8Array shuffleArray(Uint8Array pkx, uint sv)
        {
            Uint8Array ekx = new Uint8Array(pkx.length); Uint8ArrayHelper.Copy(pkx, 0, ekx, 0, 8);

            // Now to shuffle the blocks

            // Define Shuffle Order Structure
            var aloc = new byte[] { 0, 0, 0, 0, 0, 0, 1, 1, 2, 3, 2, 3, 1, 1, 2, 3, 2, 3, 1, 1, 2, 3, 2, 3 };
            var bloc = new byte[] { 1, 1, 2, 3, 2, 3, 0, 0, 0, 0, 0, 0, 2, 3, 1, 1, 3, 2, 2, 3, 1, 1, 3, 2 };
            var cloc = new byte[] { 2, 3, 1, 1, 3, 2, 2, 3, 1, 1, 3, 2, 0, 0, 0, 0, 0, 0, 3, 2, 3, 2, 1, 1 };
            var dloc = new byte[] { 3, 2, 3, 2, 1, 1, 3, 2, 3, 2, 1, 1, 3, 2, 3, 2, 1, 1, 0, 0, 0, 0, 0, 0 };

            // Get Shuffle Order
            var shlog = new byte[] { aloc[sv], bloc[sv], cloc[sv], dloc[sv] };

            // UnShuffle Away!
            for (int b = 0; b < 4; b++)
                Uint8ArrayHelper.Copy(pkx, 8 + 56 * shlog[b], ekx, 8 + 56 * b, 56);

            // Fill the Battle Stats back
            if (pkx.length > 232)
                Uint8ArrayHelper.Copy(pkx, 232, ekx, 232, 28);
            return ekx;
        }

        // Original code by Kaphotics
        public static Uint8Array decrypt(Uint8Array ekx)
        {
            Uint8Array pkx = new Uint8Array(232); Uint8ArrayHelper.Copy(ekx, 0, pkx, 0, 0xE8);
            uint pv = BitConverter.ToUInt32(pkx, 0);
            uint sv = (((pv & 0x3E000) >> 0xD) % 24);

            uint seed = pv;

            Uint16Array pkx16 = new Uint16Array(pkx.buffer);
            // Decrypt Blocks with RNG Seed
            for (int i = 4; i < 232/2; ++i)
            {
                seed = LCRNG.next(seed);
                pkx16[i] ^= (ushort)(seed >> 0x10);
            }

            // TODO: decrypt party stats?

            // Deshuffle
            pkx = shuffleArray(pkx, sv);
            return pkx;
        }

        // Original code by Kaphotics
        public static Uint8Array encrypt(Uint8Array pkx)
        {
            // Shuffle
            uint pv = BitConverter.ToUInt32(pkx, 0);
            uint sv = (((pv & 0x3E000) >> 0xD) % 24);

            Uint8Array ekx = new Uint8Array(pkx.length); Uint8ArrayHelper.Copy(pkx, 0, ekx, 0, pkx.length);

            // If I unshuffle 11 times, the 12th (decryption) will always decrypt to ABCD.
            // 2 x 3 x 4 = 12 (possible unshuffle loops -> total iterations)
            for (int i = 0; i < 11; i++)
                ekx = shuffleArray(ekx, sv);

            uint seed = pv;
            Uint16Array ekx16 = new Uint16Array(ekx.buffer);
            // Encrypt Blocks with RNG Seed
            for (int i = 4; i < 232/2; ++i)
            {
                seed = LCRNG.next(seed);
                ekx16[i] ^= (ushort)(seed >> 16);
            }

            // Encrypt the Party Stats
            seed = pv;
            if (pkx.length > 232)
                for (int i = 232/2; i < 260/2; ++i)
                {
                    seed = LCRNG.next(seed);
                    ekx16[i] ^= (ushort)(seed >> 16);
                }

            // Done
            return ekx;
        }

        // Code by Kaphotics
        public static bool verifyCHK(Uint8Array pkx)
        {
            // TODO refactor, probably pass Uint16Array
            ushort chk = 0;
            for (int i = 8; i < 232; i += 2) // Loop through the entire PKX
                chk += BitConverter.ToUInt16(pkx, i);

            ushort actualsum = BitConverter.ToUInt16(pkx, 0x6);
            if ((BitConverter.ToUInt16(pkx, 0x8) > 750) || (BitConverter.ToUInt16(pkx, 0x90) != 0))
                return false;
            return ((chk&0xFFFF) == actualsum);
        }

        public static byte getDloc(uint ec)
        {
            // Define Shuffle Order Structure
            var dloc = new byte[] { 3, 2, 3, 2, 1, 1, 3, 2, 3, 2, 1, 1, 3, 2, 3, 2, 1, 1, 0, 0, 0, 0, 0, 0 };
            uint sv = (((ec & 0x3E000) >> 0xD) % 24);

            return dloc[sv];
        }
    }
}
