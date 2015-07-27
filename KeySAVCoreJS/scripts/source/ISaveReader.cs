namespace KeySAVCore
{
    public interface ISaveReader
    {
        string KeyName { get;  }
        ushort UnlockedSlots { get;  }
        void scanSlots(ushort from, ushort to);
        void scanSlots();
        void scanSlots(ushort pos);

        Structures.PKX? getPkx(ushort pos);
    }
}
