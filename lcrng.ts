/// <reference path="typings/cuint/cuint.d.ts"/>
import * as cuint from "cuint";

var mul_const = cuint.UINT32(1103515245);
var add_const = cuint.UINT32(24691);

export function next(seed) {
    return cuint.UINT32(seed).multiply(mul_const).add(add_const).toNumber() >>> 0;
}
