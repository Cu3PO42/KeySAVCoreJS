import PkBase from "./pkbase";

/**
 * A class for accessing the data stored in a save file.
 */
interface SaveReader {
  /**
   * The number of slots that are unlocked.
   */
  unlockedSlots: number;

  /**
   * Flag signifying whether the key in use for this reader is a new-style key.
   */
  isNewKey: boolean;

  /**
   * The generation of the save file this reader has opened.
   */
  generation: number;

  /**
   * Scan the slots between from and to to improve the key.
   *
   * @param from The first slot to scan, inclusive
   * @param to The first slot not to scan, exclusive
   */
  scanSlots(from: number, to: number);

  /**
   * Scan the given slot to improve the key.
   *
   * @param slot The slot to scan
   */
  scanSlots(slot: number);

  /**
   * Scan all slots in the save file to improve the key.
   */
  scanSlots();

  /**
   * Decrypt and return the Pokémon in the given slot, if posssible. If there is no Pokémon there, return undefined.
   * In case of a slot that is not fully decrypted, a Pokémon may be returned even though there is none there.
   *
   * @param pos The slot from which to retrieve the Pokémon
   * @return The Pokémon in the slot
   */
  getPkx(pos: number): PkBase;

  /**
   * Return all Pokémon in the save that can be decrypted.
   *
   * @return
   */
  getAllPkx(): PkBase[];
}

export default SaveReader;
