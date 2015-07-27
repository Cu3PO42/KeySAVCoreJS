using System.IO;
using System.Linq;
using JS;

namespace KeySAVCore
{
    public static class Utility
    {
        public static Uint8Array xor(Uint8Array one, Uint8Array two)
        {
            if (one.length != two.length)
                return null;
            int length = one.length;
            Uint8Array res = new Uint8Array(length);
            for (int i = 0; i < length; ++i)
            {
                res[i] = (byte)(one[i] ^ two[i]);
            }
            return res;
        }

        public static Uint8Array xor(Uint8Array first, Uint8Array second, int secondoffset)
        {
            return xor(first, 0, second, secondoffset, first.length);
        }

        public static Uint8Array xor(Uint8Array first, int firstOffset, Uint8Array second, int secondOffset, int length)
        {
            Uint8Array res = new Uint8Array(length);
            for (int i = 0; i < length; ++i)
            {
                res[i] = (byte)(first[firstOffset + i] ^ second[secondOffset + i]);
            }
            return res;
        }

        public static void xor(Uint8Array first, int firstOffset, Uint8Array second, int secondOffset, Uint8Array target,
            int targetOffset, uint length)
        {
            for (int i = 0; i < length; ++i)
                target[i + targetOffset] = (byte)(first[i + firstOffset] ^ second[i + secondOffset]);
        }

        public static void XorInPlace(this Uint8Array self, int offset, Uint8Array other, int otherOffset, int length)
        {
            for (uint i = 0; i < length; ++i)
                self[(int)(i+offset)] = (byte)(self[(int)(i+offset)] ^ other[(int)(i+otherOffset)]);
        }

        public static bool SequenceEqual(this Uint8Array self, Uint8Array other, int offset)
        {
            for (int i = 0; i < self.length; ++i)
            {
                if (self[i] != other[offset+i])
                    return false;
            }
            return true;
        }

        public static bool SequenceEqual(Uint8Array one, int oneOffset, Uint8Array two, int twoOffset, int length)
        {
            for (int i = 0; i < length; ++i)
            {
                if (one[i + oneOffset] != two[i + twoOffset])
                    return false;
            }
            return true;
        }

        public static bool SequenceEqual(this Uint8Array self, Uint8Array other)
        {
            for (int i = 0; i < self.length; ++i)
            {
                if (self[i] != other[i])
                    return false;
            }
            return true;
        }

        public static bool Empty(this byte[] array)
        {
            return array.All(e => e == 0);
        }

        public static bool Empty(byte[] array, uint offset, uint length)
        {
            for (uint i = offset; i < offset+length; ++i)
                if (array[i] != 0)
                    return false;
            return true;
        }

        public static string TrimCString(this string str)
        {
            int index = str.IndexOf('\0');
            if (index < 0)
                return str;

            return str.Substring(0, index);
        }

        public static string CleanFileName(string fileName)
        {
            return Path.GetInvalidFileNameChars().Aggregate(fileName, (current, c) => current.Replace(c.ToString(), string.Empty));
        }

        public static void Switch<T>(ref T one, ref T two)
        {
            T tmp = one;
            one = two;
            two = tmp;
        }
    }
}
