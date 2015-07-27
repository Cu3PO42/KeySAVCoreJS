using System;
using System.IO;
using KeySAVCore.Structures;
using JS;

namespace KeySAVCore
{
    public class BattleVideoReader
    {
        private const ushort offset = 0x4E18;
        private const ushort keyoff = 0x100;

        private Uint8Array video;
        private Uint8Array key;

        internal BattleVideoReader(Uint8Array file, Uint8Array key_)
        {
            video = file;
            key = key_;
        }
        
        public PKX? getPkx(byte slot, bool opponent)
        {
            Uint8Array ekx;
            Uint8Array pkx;
            byte opponent_ = opponent ? (byte)1 : (byte)0;
            ekx = Utility.xor(video, offset + 260 * slot + opponent_ * 0x620, key, keyoff + 260 * slot + opponent_ * 0x700, 260);
            pkx = PKX.decrypt(ekx);
            if (pkx.Empty())
            {
                return null;
            }
            return new PKX(PKX.verifyCHK(pkx) ? pkx : ekx, -1, slot, false);
        }

        public bool DumpsEnemy
        {
            get { return (BitConverter.ToUInt32(key, 0x800) | BitConverter.ToUInt32(key, 0x804)) != 0; }
        }
    }
}
