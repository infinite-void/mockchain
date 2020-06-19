const Transaction = require('./transaction');
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

    createTransaction({ recipient, amount }) {
        if(amount > this.balance)
            throw new Error('Amount exceeds balance');

        return new Transaction({
            senderWallet: this,
            amount: amount,
            recipient: recipient
        })
    }
};

module.exports = Wallet;