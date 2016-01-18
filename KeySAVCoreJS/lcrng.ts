import * as cuint from "cuint";

export function next(seed) {
    return cuint.UINT32(seed).multiply(mul_const).add(add_const).toNumber() >>> 0;
}
