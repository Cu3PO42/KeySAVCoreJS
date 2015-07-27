using JS;

namespace KeySAVCore.Structures
{
    public struct SaveBreakResult
    {
        public readonly bool success;
        public readonly string result;
        public readonly Uint8Array resPkx;
        public readonly SaveKey? key;

        public SaveBreakResult(bool success, string result, SaveKey? key, Uint8Array resPkx)
        {
            this.success = success;
            this.result = result;
            this.key = key;
            this.resPkx = resPkx;
        }
    }
}
