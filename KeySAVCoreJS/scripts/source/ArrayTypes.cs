using System;
using DuoCode.Runtime;

namespace JS
{
    [Js(Extern = true, Name = "ArrayBuffer")]
    public class ArrayBuffer
    {
        [Js(Extern = true, Name = "byteLength")]
        int byteLength;

        public ArrayBuffer(int length)
        {
        }
    }

    public interface TypedArray
    {

    }

    [Js(Extern = true, Name = "Uint8Array")]
    public class Uint8Array : TypedArray
    {
        public Uint8Array(int length)
        {
        }

        public Uint8Array(TypedArray e)
        {
        }

        public Uint8Array(ArrayBuffer buf)
        {
        }

        public Uint8Array(ArrayBuffer buf, int offset)
        {
        }

        public Uint8Array(ArrayBuffer buf, int offset, int length)
        {
        }

        [Js(Extern = true)]
        public byte this[int index]
        {
            get
            {
                return 0;
            }
            set
            {
            }
        }

        [Js(Extern = true, Name = "subarray")]
        public Uint8Array subarray(int begin, int end)
        {
            return new Uint8Array(0);
        }


        [Js(Extern = true, Name = "length")]
        public readonly int length;

        [Js(Extern = true, Name = "buffer")]
        public readonly ArrayBuffer buffer;

        [Js(Extern = true, Name = "byteOffset")]
        public readonly int byteOffset;
    }

    internal static class Uint8ArrayHelper {
        internal static void Copy(Uint8Array one, int offsetOne, Uint8Array two, int offsetTwo, int length)
        {
            for (int i = 0; i < length; ++i)
                two[offsetTwo+i] = one[offsetOne+i];
        }

        internal static void Copy(byte[] one, int offsetOne, Uint8Array two, int offsetTwo, int length)
        {
            for (int i = 0; i < length; ++i)
                two[offsetTwo+i] = one[offsetOne+i];
        }

        internal static bool Empty(this Uint8Array arr)
        {
            for (int i = 0; i < arr.length; ++i)
            {
                if (arr[i] != 0)
                    return false;
            }
            return true;
        }

        internal static bool Empty(this Uint8Array arr, int offset, int length)
        {
            for (int i = offset; i < offset+length; ++i)
            {
                if (arr[i] != 0)
                    return false;
            }
            return true;
        }

        public static void fill(this Uint8Array self, byte value)
        {
            for (int i = 0; i < self.length; ++i)
                self[i] = value;
        }

        public static void fill(this Uint8Array self, byte value, int start, int stop)
        {
            while (start < 0) start += self.length;
            while (stop < 0) stop += self.length;

            for (int i = start; i < stop; ++i)
                self[i] = value;
        }

    }

    [Js(Extern = true, Name = "Uint16Array")]
    public class Uint16Array : TypedArray
    {
        public Uint16Array(int length)
        {
        }

        public Uint16Array(TypedArray e)
        {
        }

        public Uint16Array(ArrayBuffer buf)
        {
        }

        public Uint16Array(ArrayBuffer buf, int offset)
        {
        }

        public Uint16Array(ArrayBuffer buf, int offset, int length)
        {
        }

        [Js(Extern = true)]
        public ushort this[int index]
        {
            get
            {
                return 0;
            }
            set
            {
            }
        }

        [Js(Extern = true, Name = "subarray")]
        public Uint16Array subarray(int begin, int end)
        {
            return new Uint16Array(0);
        }

        [Js(Extern = true, Name = "every")]
        public bool every(Func<ushort, bool> fn)
        {
            return true;
        }

        public void fill(byte value)
        {

        }

        [Js(Extern = true, Name = "length")]
        public readonly int length;
    }

    [Js(Extern = true, Name = "Uint32Array")]
    public class Uint32Array : TypedArray
    {
        public Uint32Array(int length)
        {
        }

        public Uint32Array(TypedArray e)
        {
        }

        public Uint32Array(ArrayBuffer buf)
        {
        }

        public Uint32Array(ArrayBuffer buf, int offset)
        {
        }

        public Uint32Array(ArrayBuffer buf, int offset, int length)
        {
        }

        [Js(Extern = true)]
        public uint this[int index]
        {
            get
            {
                return 0;
            }
            set
            {
            }
        }

        [Js(Extern = true, Name = "subarray")]
        public Uint32Array subarray(int begin, int end)
        {
            return new Uint32Array(0);
        }

        [Js(Extern = true, Name = "every")]
        public bool every(Func<byte, bool> fn)
        {
            return true;
        }

        [Js(Extern = true, Name = "length")]
        public readonly int length;
    }

}
