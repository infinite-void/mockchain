const Block = require('./block');
const cryptoHash = require('../utils/crypto-hash');

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

    replaceChain(chain) {
        if(chain.length <= this.chain.length) {
            console.error('Incoming chain is expected to be longer then the original chain');
            return;
        }

        if(!Blockchain.isValidChain(chain)) {
            console.error('Incoming chain is expected to be a valid chain');
            return;
        }
        
        console.log('replacing chain with ', chain, '...');
        this.chain = chain;
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