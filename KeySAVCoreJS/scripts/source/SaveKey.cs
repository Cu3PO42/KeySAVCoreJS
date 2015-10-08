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
        public UInt32 stamp1
        {
            get
            {
                return key32[0];
            }
            set
            {
                key32[0] = value;
            }
        }
        public UInt32 stamp2
        {
            get
            {
                return key32[1];
            }
            set
            {
                key32[1] = value;
            }
        }
        public UInt32 boxOffset
        {
            get
            {
                return key32[0x1C/4];
            }
            set
            {
                key32[0x1C/4] = value;
            }
        }
        public UInt32 slot1Flag
        {
            get
            {
                return key32[0x80000/4];
            }
            set
            {
                key32[0x80000/4] = value;
            }
        }
        private uint magic
        {
            get
            {
                return key32[2];
            }
            set
            {
                key32[2] = value;
            }
        }
        public bool isNewKey
        {
            get
            {
                return !slot1Key.Empty();
            }
        }
        public readonly Uint8Array location;
        public readonly Uint8Array boxKey1;
        public readonly Uint8Array blank;
        public readonly Uint8Array slotsUnlocked;
        public readonly Uint8Array boxKey2;
        public readonly Uint8Array slot1Key;

        private readonly Uint32Array key32;

        public SaveKey(Uint8Array key)
        {
            keyData = key;
            key32 = new Uint32Array(key.buffer, key.byteOffset, 0x2D2B5);
            location = key.subarray(0x10, 0x14);
            boxKey1 = key.subarray(0x100, 0x34BD0);
            blank = key.subarray(0x34BD0, 0x34BD0 + 0xE8);
            slotsUnlocked = key.subarray(0x34CB8, 0x34CB8 + 0x3A2);
            boxKey2 = key.subarray(0x40000, 0x40000 + 0x34AD0);
            slot1Key = key.subarray(0x80004, 0x80004 + 0x34AD0);
            if (magic != 0x42454546)
            {
                magic = 0x42454546;
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
