const Block = require('./block');
const { cryptoHash } = require('../utils');
const { REWARD_INPUT, MINING_REWARD } = require('../config');
const Transaction = require('../wallet/transaction');
const Wallet = require('../wallet');

class Blockchain {
    
    constructor() {
        this.chain = [Block.genesis()]; 
    }

    addBlock({data: data}) {
        const newBlock = Block.mineBlock({
            data: data,
            lastBlock: this.chain[this.chain.length - 1]
        });

        this.chain.push(newBlock);
    }

    replaceChain(chain, validateTransactionData, onSuccess) {
        if(chain.length <= this.chain.length) {
            console.error('Incoming chain is expected to be longer then the original chain');
            return;
        }

        if(!Blockchain.isValidChain(chain)) {
            console.error('Incoming chain is expected to be a valid chain');
            return;
        }
        
        if(validateTransactionData && !this.validTransactionData({ chain: chain })) {
            console.error('Incoming chain contains invalid transactionData');
            return;
        }
        
        if(onSuccess)
            onSuccess();
        
        console.log('replacing chain with ', chain, '...');
        this.chain = chain;
    }

    validTransactionData({ chain }) {
        for(let i = 1; i < chain.length; i++) {
            const block = chain[i];
            const transactionSet = new Set();
            let rewardTransactionCount = 0;

            for(let transaction of block.data) {
                if(transaction.input.address === REWARD_INPUT.address) {
                    rewardTransactionCount += 1;
                    if(rewardTransactionCount > 1) {
                        console.error('contains multiple reward for the same block ');
                        return false;
                    }
                    if(Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
                        console.error('value of MINING_REWARD is invalid in transaction ' + transaction.id);
                        return false;  
                    }
                }
                else {
                    if(!Transaction.validTransaction(transaction)) {
                        console.error('invalid outputMap in transaction ' + transaction.id);
                        return false;
                    }
                    const trueBalance = Wallet.calculateBalance({
                        chain: this.chain,
                        address: transaction.input.address
                    });
                    if(transaction.input.amount !== trueBalance) {
                        console.error('conflicting balance amount for wallet address ' + transaction.id);
                        return false;
                    }
                    if(transactionSet.has(transaction)) {
                        console.error('Block contains multiple instances of transaction ' + transaction.id);
                        return false;
                    }
                    else   
                        transactionSet.add(transaction);
                }
            }
        }
        return true;     
    }

    static isValidChain(chain) {
        if(JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) 
            return false;

        for(let i = 1; i < chain.length; i++) {
            const { timestamp, data, hash, lastHash, difficulty, nonce } = chain[i];
            const expected_lastHash = chain[i - 1].hash;
            const lastDifficulty = chain[i - 1].difficulty;

            if(lastHash !== expected_lastHash) 
                return false;
            
            const validatedHash = cryptoHash(timestamp, data, nonce, difficulty, lastHash);

            if (hash !== validatedHash) 
                return false;
            
            if(Math.abs(lastDifficulty - difficulty) > 1)
                return false;
        } 

        return true;
    }
}

module.exports = Blockchain;