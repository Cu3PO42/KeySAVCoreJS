using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using JS;

namespace KeySAVCore.Structures
{
    public struct SaveKey
    {
        public readonly Uint8Array keyData;
        public readonly UInt32 stamp1;
        public readonly UInt32 stamp2;
        public readonly Uint8Array location;
        public readonly UInt32 boxOffset;
        public readonly Uint8Array boxKey1;
        public readonly Uint8Array blank;
        public readonly Uint8Array slotsUnlocked;
        public readonly Uint8Array boxKey2;
        public readonly UInt32 slot1Flag;
        public readonly Uint8Array slot1Key;
        readonly UInt32 magic;

        public SaveKey(Uint8Array key)
        {
            keyData = key;
            Uint32Array key32 = new Uint32Array(key.buffer, key.byteOffset, 0x2D2B5);
            stamp1 = key32[0];
            stamp2 = key32[1];
            magic = key32[2];
            location = key.subarray(0x10, 0x14);
            boxOffset = key32[0x1C / 4];
            boxKey1 = key.subarray(0x100, 0x34BD0);
            blank = key.subarray(0x34BD0, 0x34BD0 + 0xE8);
            slotsUnlocked = key.subarray(0x34CB8, 0x34CB8 + 0x3A2);
            boxKey2 = key.subarray(0x40000, 0x40000 + 0x34AD0);
            slot1Flag = key32[0x80000 / 4];
            slot1Key = key.subarray(0x80004, 0x80004 + 0x34AD0);
            if (magic != 0x42454546)
            {
                magic = 0x42454546;
                key32[2] = magic;
                blank.fill(0);
                Uint8ArrayHelper.Copy(location, 0, blank, 0xE0, 0x4);
                Uint8Array nicknamebytes = Encoding.Unicode.GetBytes(SaveBreaker.eggnames[blank[0xE3] - 1]);
                Uint8ArrayHelper.Copy(nicknamebytes, 0, blank, 0x40, nicknamebytes.length > 24 ? 24 : nicknamebytes.length);

                Uint16Array blank16 = new Uint16Array(blank.buffer, blank.byteOffset, 0xE8/2);
                ushort chk = 0;
                for (byte i = 4; i < 232/2; i++)
                    chk += blank16[i];

                blank16[3] = chk;
                Uint8ArrayHelper.Copy(PKX.encrypt(blank), 0, blank, 0, 232);

                for (int i = 0; i < 930; ++i)
                    slotsUnlocked[i] = (byte)(boxKey1.Empty(i*232, 232) ? 1 : 0);
            }
        }
    }
}
