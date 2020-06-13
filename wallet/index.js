const { STARTING_BALANCE } = require('../config');
const { ec, cryptoHash } = require('../utils');

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