using System;
using System.Linq;
using KeySAVCore.Exceptions;
using KeySAVCore.Structures;
using JS;
using DuoCode.Runtime;

namespace KeySAVCore
{
    public static class SaveBreaker
    {
        private const uint Magic = 0x42454546;
        public static readonly string[] eggnames;

        static SaveBreaker()
        {
            eggnames = new string[] {"タマゴ", "Egg", "Œuf", "Uovo", "Ei", "", "Huevo", "알"};
        }

        public static void Load(Uint8Array input, JsFunction keyGetter, JsFunction callback)
        {
            if (input.length == 0x100000)
            {
                keyGetter.invoke(BitConverter.ToUInt32(input, 0x10), BitConverter.ToUInt32(input, 0x14), (Action<Exception, SaveKey>)((Exception e, SaveKey key) => {
                    if (e == null)
                        callback.invoke(null, new SaveReaderEncrypted(input, key));
                    else
                        callback.invoke(e);
                }));
                return;
            }
            if (input.length == 0x76000 && BitConverter.ToUInt32(input, 0x75E10) == Magic)
            {
                callback.invoke(null, new SaveReaderDecrypted(input, "ORAS"));
                return;
            }
            if (input.length == 0x65600 && BitConverter.ToUInt32(input, 0x65410) == Magic)
            {
                callback.invoke(null, new SaveReaderDecrypted(input, "XY"));
                return;
            }
            if (input.length == 232 * 30 * 32)
            {
                callback.invoke(null, new SaveReaderDecrypted(input, "RAW"));
                return;
            }
            throw new NoSaveException();
        }

        // Original code by Kaphotics
        public static SaveBreakResult Break(Uint8Array break1, Uint8Array break2)
        {
            int[] offset = new int[2];
            Uint8Array empty = new Uint8Array(232);
            Uint8Array emptyekx = new Uint8Array(232);
            Uint8Array pkx = new Uint8Array(232);
            Uint8Array savkey;
            Uint8Array save1Save;
            savkey = new Uint8Array(0xB4AD4);
            string result;

            if (!Utility.SequenceEqual(break1, 0x10, break2, 0x10, 8))
            {
                return new SaveBreakResult(false, "Saves are not from the same game!\nPlease follow the instructions.", null, null);
            }

            // TODO readd upgrade logic
            if (Utility.SequenceEqual(break1, 0x80000, break2, 0x80000, 0x7F000))
            {
                save1Save = break2;
                for (int i = 0x27A00; i < 0x6CED0; ++i)
                    break2[i + 0x7F000] = (byte) (break2[i] ^ break1[i] ^ break1[i + 0x7F000]);
            }
            else if (Utility.SequenceEqual(break1, 0x1000, break2, 0x1000, 0x7F000))
            {
                save1Save = break1;
            }
            else
            {
                return new SaveBreakResult(false, "The saves are seperated by more than one save.\nPlease follow the instructions.", null, null);
            }

            Utility.Switch(ref break1, ref break2);

            #region Finding the User Specific Data: Using Valid to keep track of progress...
            // Do Break. Let's first do some sanity checking to find out the 2 offsets we're dumping from.
            // Loop through save file to find
            int fo = 0xA6A00; // Initial Offset, can tweak later.

            for (int d = 0; d < 2; d++)
            {
                // Do this twice to get both box offsets.
                for (int i = fo; i <= 0xB8F30; i += 0x10A00) 
                {
                    int err = 0;
                    // Start at findoffset and see if it matches pattern
                    if ((break1[i + 4] == break2[i + 4]) && (break1[i + 4 + 232] == break2[i + 4 + 232]))
                    {
                        // Sanity Placeholders are the same
                        for (int j = 0; j < 4; j++)
                            if (break1[i + j] == break2[i + j])
                                err++;

                        if (err < 4)
                        {
                            // Keystream ^ PID doesn't match entirely. Keep checking.
                            for (int j = 8; j < 232; j++)
                                if (break1[i + j] == break2[i + j])
                                    err++;

                            if (err < 20)
                            {
                                // Tolerable amount of difference between offsets. We have a result.
                                offset[d] = i;
                                break;
                            }
                        }
                    }
                }
                fo = offset[d] + 232 * 30;  // Fast forward out of this box to find the next.
            }

            // Now that we have our two box offsets...
            // Check to see if we actually have them.

            if ((offset[0] == 0) || (offset[1] == 0))
            {
                // We have a problem. Don't continue.
                result = "Unable to Find Box.\n";
                result += "Keystreams were NOT bruteforced!\n\nStart over and try again :(";
                return new SaveBreakResult(false, result, null, null);
            }
            else
            {
                // Let's go deeper. We have the two box offsets.
                // Chunk up the base streams.
                Uint8Array estream1 = new Uint8Array(30 * 232);
                Uint8Array estream2 = new Uint8Array(30 * 232);
                // Stuff 'em.
                for (int i = 0; i < 30; i++)    // Times we're iterating
                {
                    for (int j = 0; j < 232; j++)   // Stuff the Data
                    {
                        estream1[i * 232 + j] = break1[offset[0] + 232 * i + j];
                        estream2[i * 232 + j] = break2[offset[1] + 232 * i + j];
                    }
                }

                // Okay, now that we have the encrypted streams, formulate our EKX.
                string nick = eggnames[1];
                // Stuff in the nickname to our blank EKX.
                Uint8Array nicknamebytes = Encoding.Unicode.GetBytes(nick);
                Uint8ArrayHelper.Copy(nicknamebytes, 0, empty, 0x40, nicknamebytes.length);

                // Encrypt the Empty PKX to EKX.
                Uint8ArrayHelper.Copy(empty, 0, emptyekx, 0, 232);
                emptyekx = PKX.decrypt(emptyekx);
                // Not gonna bother with the checksum, as this empty file is temporary.

                // Sweet. Now we just have to find the E0-E3 values. Let's get our polluted streams from each.
                // Save file 1 has empty box 1. Save file 2 has empty box 2.
                Uint8Array pstream1 = new Uint8Array(30 * 232); // Polluted Keystream 1
                Uint8Array pstream2 = new Uint8Array(30 * 232); // Polluted Keystream 2
                for (int i = 0; i < 30; i++)    // Times we're iterating
                {
                    for (int j = 0; j < 232; j++)   // Stuff the Data
                    {
                        pstream1[i * 232 + j] = (byte)(estream1[i * 232 + j] ^ emptyekx[j]);
                        pstream2[i * 232 + j] = (byte)(estream2[i * 232 + j] ^ emptyekx[j]);
                    }
                }

                // Cool. So we have a fairly decent keystream to roll with. We now need to find what the E0-E3 region is.
                // 0x00000000 Encryption Constant has the D block last. 
                // We need to make sure our Supplied Encryption Constant Pokemon have the D block somewhere else (Pref in 1 or 3).

                // First, let's get out our polluted EKX's.
                byte[,] polekx = new Byte[6, 232];
                for (int i = 0; i < 6; i++)
                    for (int j = 0; j < 232; j++) // Save file 1 has them in the second box. XOR them out with the Box2 Polluted Stream
                        polekx[i, j] = (byte)(break1[offset[1] + 232 * i + j] ^ pstream2[i* 232 + j]);

                uint[] encryptionconstants = new uint[6]; // Array for all 6 Encryption Constants. 
                int valid = 0;
                for (int i = 0; i < 6; i++)
                {
                    encryptionconstants[i] = (uint)polekx[i, 0];
                    encryptionconstants[i] += (uint)polekx[i, 1] * 0x100;
                    encryptionconstants[i] += (uint)polekx[i, 2] * 0x10000;
                    encryptionconstants[i] += (uint)polekx[i, 3] * 0x1000000;
                    // EC Obtained. Check to see if Block D is not last.
                    if (PKX.getDloc(encryptionconstants[i]) != 3)
                    {
                        valid++;
                        // Find the Origin/Region data.
                        Uint8Array encryptedekx = new Uint8Array(232);
                        Uint8Array decryptedpkx = new Uint8Array(232);
                        for (int z = 0; z < 232; z++)
                            encryptedekx[z] = polekx[i, z];

                        decryptedpkx = PKX.decrypt(encryptedekx);

                        // finalize data

                        // Okay, now that we have the encrypted streams, formulate our EKX.
                        nick = eggnames[decryptedpkx[0xE3] - 1];
                        // Stuff in the nickname to our blank EKX.
                        nicknamebytes = Encoding.Unicode.GetBytes(nick);
                        Uint8ArrayHelper.Copy(nicknamebytes, 0, empty, 0x40, nicknamebytes.length);

                        // Dump it into our Blank EKX. We have won!
                        empty[0xE0] = decryptedpkx[0xE0];
                        empty[0xE1] = decryptedpkx[0xE1];
                        empty[0xE2] = decryptedpkx[0xE2];
                        empty[0xE3] = decryptedpkx[0xE3];
                        break;
                    }
                }
                #endregion

                if (valid == 0) // We didn't get any valid EC's where D was not in last. Tell the user to try again with different specimens.
                {
                    result = "The 6 supplied Pokemon are not suitable. \nRip new saves with 6 different ones that originated from your save file.\n";
                    result += "Keystreams were NOT bruteforced!\n\nStart over and try again :(";
                    return new SaveBreakResult(false, result, null, null);
                }

                else
                {
                    #region Fix up our Empty File
                    // We can continue to get our actual keystream.
                    // Let's calculate the actual checksum of our empty pkx.
                    Uint16Array empty16 = new Uint16Array(empty.buffer);
                    ushort chk = 0;
                    for (int i = 4; i < 232 / 2; i++) // Loop through the entire PKX
                        chk += empty16[i];

                    // Apply New Checksum
                    empty16[3] = chk;

                    // Okay. So we're now fixed with the proper blank PKX. Encrypt it!
                    Uint8ArrayHelper.Copy(empty, 0, emptyekx, 0, 232);
                    emptyekx = PKX.encrypt(emptyekx);

                    // Copy over 0x10-0x1F (Save Encryption Unused Data so we can track data).
                    Uint8ArrayHelper.Copy(break1, 0x10, savkey, 0, 0x8);
                    // Include empty data
                    savkey[0x10] = empty[0xE0]; savkey[0x11] = empty[0xE1]; savkey[0x12] = empty[0xE2]; savkey[0x13] = empty[0xE3];
                    // Copy over the scan offsets.
                    Uint8ArrayHelper.Copy(BitConverter.GetBytes(offset[0]), 0, savkey, 0x1C, 4);

                    for (int i = 0; i < 30; i++)    // Times we're iterating
                    {
                        for (int j = 0; j < 232; j++)   // Stuff the Data temporarily...
                        {
                            savkey[0x100 + i * 232 + j] = (byte)(estream1[i * 232 + j] ^ emptyekx[j]);
                            savkey[0x100 + (30 * 232) + i * 232 + j] = (byte)(estream2[i * 232 + j] ^ emptyekx[j]);
                        }
                    }
                    #endregion
                    // Let's extract some of the information now for when we set the Keystream filename.
                    #region Keystream Naming
                    Uint8Array data1 = new Uint8Array(232);
                    Uint8Array data2 = new Uint8Array(232);
                    for (int i = 0; i < 232; i++)
                    {
                        data1[i] = (byte)(savkey[0x100 + i] ^ break1[offset[0] + i]);
                        data2[i] = (byte)(savkey[0x100 + i] ^ break2[offset[0] + i]);
                    }
                    Uint8Array data1a = new Uint8Array(232); Uint8Array data2a = new Uint8Array(232);
                    Uint8ArrayHelper.Copy(data1, 0, data1a, 0, 232); Uint8ArrayHelper.Copy(data2, 0, data2a, 0, 232);
                    Uint8Array pkx1 = PKX.decrypt(data1);
                    Uint8Array pkx2 = PKX.decrypt(data2);
                    ushort chk1 = 0;
                    ushort chk2 = 0;
                    for (int i = 8; i < 232; i += 2)
                    {
                        chk1 += BitConverter.ToUInt16(pkx1, i);
                        chk2 += BitConverter.ToUInt16(pkx2, i);
                    }
                    if (PKX.verifyCHK(pkx1) && Convert.ToBoolean(BitConverter.ToUInt16(pkx1, 8)))
                    {
                        // Save 1 has the box1 data
                        pkx = pkx1;
                    }
                    else if (PKX.verifyCHK(pkx2) && Convert.ToBoolean(BitConverter.ToUInt16(pkx2, 8)))
                    {
                        // Save 2 has the box1 data
                        pkx = pkx2;
                    }
                    else
                    {
                        // Data isn't decrypting right...
                        for (int i = 0; i < 232; i++)
                        {
                            data1a[i] ^= empty[i];
                            data2a[i] ^= empty[i];
                        }
                        pkx1 = PKX.decrypt(data1a); pkx2 = PKX.decrypt(data2a);
                        if (PKX.verifyCHK(pkx1) && Convert.ToBoolean(BitConverter.ToUInt16(pkx1, 8)))
                        {
                            // Save 1 has the box1 data
                            pkx = pkx1;
                        }
                        else if (PKX.verifyCHK(pkx2) && Convert.ToBoolean(BitConverter.ToUInt16(pkx2, 8)))
                        {
                            // Save 2 has the box1 data
                            pkx = pkx2;
                        }
                        else
                        {
                            // Sigh...
                            return new SaveBreakResult(false, "", null, null);
                        }
                    }
                    #endregion
                }
            }
            
            if (true)
            {
                // Clear the keystream file...
                savkey.fill(0, 0x100, 0x100+232*30*31);
                savkey.fill(0, 0x40000, 0x40000+232*30*31);

                // Copy the key for the slot selector
                Uint8ArrayHelper.Copy(save1Save, 0x168, savkey, 0x80000, 4);

                // Copy the key for the other save slot
                Utility.xor(break2, offset[0], break2, offset[0]-0x7F000, savkey, 0x80004, 232*30*31);

                // Since we don't know if the user put them in in the wrong order, let's just markup our keystream with data.
                Uint8Array data1 = new Uint8Array(232);
                Uint8Array data2 = new Uint8Array(232);
                for (int i = 0; i < 31; i++)
                {
                    for (int j = 0; j < 30; j++)
                    {
                        Uint8ArrayHelper.Copy(break1, offset[0] + i * (232 * 30) + j * 232, data1, 0, 232);
                        Uint8ArrayHelper.Copy(break2, offset[0] + i * (232 * 30) + j * 232, data2, 0, 232);
                        if (data1.SequenceEqual(data2))
                        {
                            // Just copy data1 into the key file.
                            Uint8ArrayHelper.Copy(data1, 0, savkey, 0x00100 + i * (232 * 30) + j * 232, 232);
                        }
                        else
                        {
                            // Copy both datas into their keystream spots.
                            Uint8ArrayHelper.Copy(data1, 0, savkey, 0x00100 + i * (232 * 30) + j * 232, 232);
                            Uint8ArrayHelper.Copy(data2, 0, savkey, 0x40000 + i * (232 * 30) + j * 232, 232);
                        }
                    }
                }

                // Save file diff is done, now we're essentially done. Save the keystream.

                // Success
                result = "Keystreams were successfully bruteforced!\n\n";
                result += "Save your keystream now...";
                SaveKey tmp = new SaveKey(savkey);
                return new SaveBreakResult(true, result, tmp, pkx);
            }
        }
    }
}
