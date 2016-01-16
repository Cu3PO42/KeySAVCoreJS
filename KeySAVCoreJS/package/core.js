var vm = require('vm');
var fs = require('fs');
var _ = require('lodash');
function loadKeySAVCore() {
    var sandbox = {
        KeySAVCore: {},
        console: console,
        module: module,
        process: process
    };
    sandbox.global = sandbox;
    _.extend(sandbox, require("./jsextensions"));
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(require.resolve('./mscorlib')).toString(), sandbox);
    vm.runInContext(fs.readFileSync(require.resolve('./KeySAVCoreJS')).toString(), sandbox);
    return sandbox.KeySAVCore;
}
module.exports = loadKeySAVCore();
