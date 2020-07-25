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

    createTransaction({ recipient, amount, chain }) {
        if(chain) {
            this.balance = Wallet.calculateBalance({
                chain: chain,
                address: this.publicKey
            });
        }

        if(amount > this.balance)
            throw new Error('Amount exceeds balance');

        return new Transaction({
            senderWallet: this,
            amount: amount,
            recipient: recipient
        })
    }

    static calculateBalance({ chain, address }) {
        let hasConductedTransactions = false;
        let totalOutputs = 0;

        for(let i = chain.length - 1; i > 0; i--) {
            let block = chain[i];
            for(let transaction of block.data) {
                if(transaction.input.address === address)
                    hasConductedTransactions = true;

                const outputAmount = transaction.outputMap[address];
                if(outputAmount) 
                    totalOutputs += outputAmount;
                    
            }
            if(hasConductedTransactions)
                break;
        }

        return hasConductedTransactions ? totalOutputs : STARTING_BALANCE + totalOutputs;
    }
};

module.exports = Wallet;