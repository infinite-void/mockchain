const uuid = require('uuid');
const { verifySignature } = require('../utils');
const { REWARD_INPUT, MINING_REWARD } = require('../config');

class Transaction {
    constructor({ senderWallet, recipient, amount, outputMap, input }) {
        this.id = uuid.v1();
        this.outputMap = outputMap || this.createOutputMap({ senderWallet, recipient, amount });
        this.input = input || this.createInput({ senderWallet, outputMap: this.outputMap });
    }

    createOutputMap({ senderWallet, recipient, amount}) {
        const outputMap = {};

        outputMap[recipient] = amount;
        outputMap[senderWallet.publicKey] = senderWallet.balance - amount;
        return outputMap;
    }

    createInput({ senderWallet, outputMap }) {
        return {
            timestamp: Date.now(),
            amount: senderWallet.balance,
            address: senderWallet.publicKey,
            signature: senderWallet.sign(outputMap)
        };
    }

    update({ senderWallet, recipient, amount }) {
        if(amount > this.outputMap[senderWallet.publicKey]) 
            throw new Error('Amount exceeds balance');

        if(this.outputMap[recipient]) 
            this.outputMap[recipient] += amount;
        else 
            this.outputMap[recipient] = amount;
        
        this.outputMap[senderWallet.publicKey] = this.outputMap[senderWallet.publicKey] - amount;

        this.input = this.createInput({ senderWallet, outputMap: this.outputMap})
    }

    static validTransaction(transaction) {
        const { input: { address, amount, signature }, outputMap } = transaction;
        const totalAmount = Object.values(outputMap).reduce((total, outputAmount) => total += outputAmount);

        if(totalAmount !== amount) {
            console.error(`Invalid transaction from ${address} as amount don't match.`);
            return false;
        }
        
        if(!verifySignature({
            publicKey: address,
            data: outputMap,
            signature: signature
        })) {
            console.error(`Invalid transaction from ${address} as signature is invalid`);
            return false;
        }

        return true;
    }

    static rewardTransaction({ minerWallet }) {
        return new this({
            outputMap: { [minerWallet.publicKey]: MINING_REWARD },
            input: REWARD_INPUT
        });
    }
}

module.exports = Transaction;