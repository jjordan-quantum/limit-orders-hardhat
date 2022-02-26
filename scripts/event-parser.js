const util = require('util');
const abiDecoder = require('abi-decoder');
// usage:
// abiDecoder.addABI(CONTRACT_ABI_0);
// abiDecoder.addABI(CONTRACT_ABI_1);

function getDecodedLogs(receipt) {
    const util = require('util');
    return abiDecoder.decodeLogs(receipt.logs);
}