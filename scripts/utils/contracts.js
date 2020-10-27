module.exports = { 
    getFunctionSigs(interface) {
        return Object.values(interface.functions).map(fragment => ({ name: fragment.name, sig: interface.getSighash(fragment) }));
    }
}