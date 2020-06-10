const { STARTING_BALANCE } = require('../config');
const { ec } = require('../utils');
const cryptoHash = require('../utils/crypto-hash');

class Wallet{

    constructor() {
        this.keyPair = ec.genKeyPair();
        this.publicKey = this.keyPair.getPublic().encode('hex');
        this.balance = STARTING_BALANCE;
    }

    sign(data) {
        return this.keyPair.sign(cryptoHash(data));
    }
};

module.exports = Wallet;