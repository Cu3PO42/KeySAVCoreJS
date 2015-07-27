using DuoCode.Runtime;
using JS;
namespace KeySAVCore
{
    class BitConverter
    {
        public static ushort ToUInt16(byte[] array, ulong pos)
        {
            return (ushort)(array[pos] | array[pos + 1] << 8);
        }

        public static ushort ToUInt16(byte[] array, int pos)
        {
            return ToUInt16(array, (ulong)pos);
        }

        public static ushort ToUInt16(Uint8Array array, int pos)
        {
            return (ushort)(array[pos] | array[pos + 1] << 8);
        }

        public static uint ToUInt32(byte[] arr, ulong pos)
        {
            return (uint)(arr[pos] | arr[pos + 1] << 8 | arr[pos + 2] << 16 | arr[pos + 3] << 24);
        }
        public static int ToInt32(byte[] arr, ulong pos)
        {
            return arr[pos] | arr[pos + 1] << 8 | arr[pos + 2] << 16 | arr[pos + 3] << 24;
        }

        public static uint ToUInt32(Uint8Array arr, int pos)
        {
            return (uint)(arr[pos] | arr[pos + 1] << 8 | arr[pos + 2] << 16 | arr[pos + 3] << 24);
        }
        public static int ToInt32(Uint8Array arr, int pos)
        {
            return arr[pos] | arr[pos + 1] << 8 | arr[pos + 2] << 16 | arr[pos + 3] << 24;
        }

        public static byte[] GetBytes(ushort val)
        {
            byte[] res = { (byte)(val & 0xFF), (byte)(val >> 8) };
            return res;
        }

        public static byte[] GetBytes(int val)
        {
            byte[] res = { (byte)(val & 0xFF), (byte)((val >> 8) & 0xFF), (byte)((val >> 16) & 0xFF), (byte)((val >> 24) & 0xFF) };
            return res;
        }
        public static byte[] GetBytes(uint val)
        {
            byte[] res = { (byte)(val & 0xFF), (byte)((val >> 8) & 0xFF), (byte)((val >> 16) & 0xFF), (byte)((val >> 24) & 0xFF) };
            return res;
        }
    }

    /*class Array
    {
        public static void Copy<T>(T[] src, T[] dest, ulong length)
        {
            for (ulong i = 0; i < length; ++i)
            {
                dest[i] = src[i];
            }
        }

        public static void Copy<T>(T[] src, T[] dest, int length)
        {
            Copy(src, dest, (ulong)length);
        }

        public static void Copy<T>(T[] src, ulong srcOffset, T[] dest, ulong destOffset, ulong length)
        {
            for (ulong i = 0; i < length; ++i)
            {
                dest[destOffset + i] = src[srcOffset + 1];
            }
        }

        public static void Copy<T>(T[] src, int srcOffset, T[] dest, int destOffset, int length)
        {
            Copy(src, (ulong)srcOffset, dest, (ulong)destOffset, (ulong)length);
        }

        public static void Clear(byte[] arr, int offset, int length)
        {
            for (int i = 0; i < length; ++i)
            {
                arr[i] = 0;
            }
        }
    }*/

    // TODO get rid if this
    class Convert
    {
        public static bool ToBoolean(int val)
        {
            return val != 0;
        }
    }

    namespace Encoding
    {
        [Js(Extern=true, Name="Unicode16LE")]
        public class Unicode
        {
            [Js(Extern=true, Name="GetString")]
            public static string GetString(Uint8Array array, int offset, int length)
            {
                return "";
            }

            [Js(Extern=true, Name="GetBytes")]
            public static Uint8Array GetBytes(string s)
            {
                return new Uint8Array(0);
            }
        }
    }

    [Js(Extern=true, Name="LCRNG")]
    class LCRNG
    {

        [Js(Extern=true, Name="next")]
        public static uint next(uint seed)
        {
            return 0;
        }
    }
}
