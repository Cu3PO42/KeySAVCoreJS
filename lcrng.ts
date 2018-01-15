const add_const_lo = 0x6073;
const mul_const_lo = 0x4e6d;
const mul_const_hi = 0x41c6;

/**
 * Advance the linear congruential PRNG with the given seed. The parameters are hardcoded to what is used in the
 * Pokémon games.
 *
 * @param seed The seed to advance
 * @return The next seed
 */
export function next(seed) {
  let seed_lo = seed & 0xffff;
  let seed_hi = seed >>> 0x10;

  let res_lo = seed_lo * mul_const_lo;
  let res_hi = ((((res_lo >>> 0x10) + seed_hi * mul_const_lo) & 0xffff) + seed_lo * mul_const_hi) & 0xffff;
  res_lo &= 0xffff;

  res_lo += add_const_lo;
  res_hi += res_lo >>> 0x10;

  return ((res_lo & 0xffff) | ((res_hi & 0xffff) << 0x10)) >>> 0;
}
