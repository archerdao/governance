const { getFunctionSigs } = require("./contracts");

module.exports = { 
    noSelectorClashes(prism, implementation) {
        let prismSigs = getFunctionSigs(prism.interface);
        let impSigs = getFunctionSigs(implementation.interface);
        let noClashes = true;
        for (const impSig of impSigs) {
            for (const prismSig of prismSigs) {
                if (impSig.sig == prismSig.sig) {
                    noClashes = false;
                    console.log("Function: " + impSig.name + " in implementation contract clashes with " + prismSig.name + " in prism contract (signature: " + impSig.sig + ")");
                    console.log("Change function name and/or params for " + impSig.name);
                }
            }
        }
        return noClashes;
    }
}