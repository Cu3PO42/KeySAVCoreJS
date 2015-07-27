using JS;

namespace KeySAVCore.Structures
{
    public class BattleVideoBreakResult
    {
        public readonly bool success;
        public readonly string result;
        public readonly Uint8Array key;

        public BattleVideoBreakResult(bool success, string result, Uint8Array key)
        {
            this.success = success;
            this.result = result;
            this.key = key;
        }
    }
}
