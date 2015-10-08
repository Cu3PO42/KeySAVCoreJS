using System;
using KeySAVCore.Structures;
using JS;

namespace KeySAVCore
{
    public class SaveReaderDecrypted : ISaveReader
    {
        private const uint orasOffset = 0x33000;
        private const uint xyOffset = 0x22600;
        private const uint xyRamsavOffset = 0x1EF38;
        private const uint orasRamsavOffset = 0x2F794;

        private readonly Uint8Array sav;
        private readonly uint offset;

        public string KeyName
        {
            get { return "Decrypted. No Key needed"; }
        }

        public ushort UnlockedSlots
        {
            get { return 930;  }
        }

        public bool IsNewKey
        {
            get { return true; }
        }

        internal SaveReaderDecrypted(Uint8Array file, string type)
        {
            sav = file;
            switch (type)
            {
                case "XY":
                    offset = xyOffset;
                    break;
                case "ORAS":
                    offset = orasOffset;
                    break;
                case "YABD":
                    offset = 4;
                    Uint8Array ekx = file.subarray(4, 236);
                    if (!PKX.verifyCHK(PKX.decrypt(ekx)))
                        offset = 8;
                    break;
                case "PCDATA":
                    offset = 0;
                    break;
                case "XYRAM":
                    offset = xyRamsavOffset;
                    break;
                case "ORASRAM":
                    offset = orasRamsavOffset;
                    break;
            }
        }

        public void scanSlots() {}
        public void scanSlots(ushort pos) {}
        public void scanSlots(ushort from, ushort to) {}

        public PKX? getPkx(ushort pos)
        {
            int pkxOffset = (int)(offset + pos*232);
            Uint8Array pkx = sav.subarray(pkxOffset, pkxOffset + 232);
            if (pkx.Empty())
                return null;
            pkx = PKX.decrypt(pkx);
            if (PKX.verifyCHK(pkx) && (pkx[8]|pkx[9]) != 0)
            {
                return new PKX(pkx, (byte)(pos/30), (byte)(pos%30), false);

            }
            return null;
        }
    }
}
