using System;
using System.Collections;
using KeySAVCore.Exceptions;
using KeySAVCore.Structures;
using JS;
using DuoCode.Runtime;

namespace KeySAVCore
{
    public static class BattleVideoBreaker
    {
        public static void Load(Uint8Array input, JsFunction keyGetter, JsFunction callback)
        {
            keyGetter.invoke(BitConverter.ToUInt32(input, 0x10), BitConverter.ToUInt32(input, 0x14), (Action<Exception, Uint8Array>)((Exception e, Uint8Array key) =>
            {
                if (e == null)
                    callback.invoke(null, new BattleVideoReader(input, key));
                else
                    callback.invoke(e);
            }));
        }
        // Original code by Kaphotics
        public static BattleVideoBreakResult Break(Uint8Array video1, Uint8Array video2)
        {
            Uint8Array ezeros = PKX.encrypt(new Uint8Array(260));
            Uint8Array xorstream;
            Uint8Array breakstream;
            Uint8Array bvkey = new Uint8Array(0x1000);

            string result = "";

            #region Old Exploit to ensure that the usage is correct
            // Validity Check to see what all is participating...

            breakstream = video1.subarray(0x4E18, 0x4E18 + 260 * 6);
            // XOR them together at party offset
            xorstream = Utility.xor(breakstream, 0, video2, 0x4E18, 260*6);

            // Retrieve EKX_1's data
            Uint8Array ekx1 = Utility.xor(ezeros, 0, xorstream, 260, 260);

            #endregion
            // If old exploit does not properly decrypt slot1...
            Uint8Array pkx = PKX.decrypt(ekx1);
            if (!PKX.verifyCHK(pkx))
            {
                return new BattleVideoBreakResult(false, "Improperly set up Battle Videos. Please follow directions and try again", null);
            }

            // Start filling up our key...
            #region Key Filling (bvkey)
            // Copy in the unique CTR encryption data to ID the video...
            Uint8ArrayHelper.Copy(video1, 0x10, bvkey, 0, 0x10);

            // Copy unlocking data
            Uint8Array key1 = new Uint8Array(260); Uint8ArrayHelper.Copy(video1, 0x4E18, key1, 0, 260);
            Utility.xor(ekx1, 0, key1, 0, bvkey, 0x100, 260);
            Uint8ArrayHelper.Copy(video1, 0x4E18 + 260, bvkey, 0x100 + 260, 260*5); // XORstream from save1 has just keystream.
            
            // See if Opponent first slot can be decrypted...

            breakstream = video1.subarray(0x5438, 0x5438 + 260 * 6);
            // XOR them together at party offset
            for (int i = 0; i < (260 * 6); i++)
                xorstream[i] = (byte)(breakstream[i] ^ video2[i + 0x5438]);
            // XOR through the empty data for the encrypted zero data.
            for (int i = 0; i < (260 * 5); i++)
                bvkey[0x100 + 260 + i] ^= ezeros[i % 260];

            // Retrieve EKX_2's data
            Uint8Array ekx2 = Utility.xor(xorstream, 260, ezeros, 0, 260);
            for (int i = 0; i < 260; i++)
                xorstream[i] ^= ekx2[i];
            Uint8Array pkx2 = PKX.decrypt(ekx2);
            if (PKX.verifyCHK(PKX.decrypt(ekx2)) && (BitConverter.ToUInt16(pkx2,0x8) != 0))
            {
                Utility.xor(ekx2, 0, video1, 0x5438, bvkey, 0x800, 260);
                Uint8ArrayHelper.Copy(video1, 0x5438 + 260, bvkey, 0x800 + 260, 260 * 5); // XORstream from save1 has just keystream.

                for (int i = 0; i < (260 * 5); i++)
                    bvkey[0x800 + 260 + i] ^= ezeros[i % 260];

                result = "Can dump from Opponent Data on this key too!" + System.Environment.NewLine;
            }
            #endregion

            string ot = Encoding.Unicode.GetString(pkx, 0xB0, 24).TrimCString();
            ushort tid = BitConverter.ToUInt16(pkx, 0xC);
            ushort sid = BitConverter.ToUInt16(pkx, 0xE);
            ushort tsv = (ushort)((tid ^ sid) >> 4);
            // Finished, allow dumping of breakstream
            result += String.Format("Success!\nYour first Pokemon's TSV: {0}\nOT: {1}\n\nPlease save your keystream.", tsv.ToString("D4"),ot);

            return new BattleVideoBreakResult(true, result, bvkey);
        }
    }
}
