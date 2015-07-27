/*using System;
using System.Collections.Generic;
using System.IO;
using KeySAVCore.Structures;
using KeySAVCore.Exceptions;

namespace KeySAVCore
{
    internal static class SaveKeyStore
    {
        private static Dictionary<UInt64, Tuple<string, Lazy<SaveKey>>> keys;
        internal static string path;

        static SaveKeyStore()
        {
            keys = new Dictionary<ulong, Tuple<string, Lazy<SaveKey>>>();
            path = "";

            ScanSaveDirectory();

            AppDomain.CurrentDomain.ProcessExit += Save;

            FileSystemWatcher watcher = new FileSystemWatcher(path, "*.bin");
            watcher.NotifyFilter = NotifyFilters.LastWrite;
            watcher.Created += (object sender, FileSystemEventArgs e) => {
                UpdateFile(e.FullPath);
            };
        }

        private static void ScanSaveDirectory()
        {
            string[] files = Directory.GetFiles(path, "*.bin", SearchOption.AllDirectories);
            foreach (string file in files)
            {
                FileInfo info = new FileInfo(file);
                if (info.Length == 0xB4AD4)
                {
                    UpdateFile(file);
                }
            }
        }

        internal static SaveKey GetKey(ulong stamp, out string keyname)
        {
            if (keys.ContainsKey(stamp))
            {
                keyname = keys[stamp].Item1;
                return keys[stamp].Item2.Value;
            }

            throw new NoKeyException();
        }

        internal static void Save(object sender, EventArgs e)
        {
            foreach (var key in keys)
            {
                if (key.Value.Item2.IsValueCreated)
                    key.Value.Item2.Value.Save(key.Value.Item1);
            }
        }

        internal static void UpdateFile(string file)
        {
            try
            {
                using (FileStream fs = new FileStream(file, FileMode.Open, FileAccess.Read))
                {
                    byte[] stamp = new byte[8];
                    fs.Read(stamp, 0, 8);
                    UpdateFile(file, BitConverter.ToUInt64(stamp, 0));
                }
            }
            catch (IOException ex)
            {
                Console.WriteLine(ex.Message);
            }

        }

        internal static void UpdateFile(string file, UInt64 stamp)
        {
            keys[stamp] = new Tuple<string,Lazy<SaveKey>>(file, new Lazy<SaveKey>(() => SaveKey.Load(file)));
        }

        internal static void UpdateFile(string filename, SaveKey key)
        {
            keys[key.stamp] = new Tuple<string, Lazy<SaveKey>>(filename, new Lazy<SaveKey>(
                () => key));
        }
    }
}
*/