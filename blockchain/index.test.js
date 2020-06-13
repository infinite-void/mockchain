const Blockchain = require('./index');
const Block = require('./block');
const { cryptoHash } = require('../utils');

describe('Blockchain', () => {
    let blockchain, newChain, originalChain;

    beforeEach(() => {
        blockchain = new Blockchain();
        newChain = new Blockchain();

        originalChain = blockchain.chain;
    });

    describe('chain()', () => {
        it('contains a `chain` array', () => {
            expect(blockchain.chain instanceof Array).toBe(true);
        });

        it('starts with `genesis` block', () => {
            expect(blockchain.chain[0]).toEqual(Block.genesis());
        });
    });

    describe('addChain()', () => {
        it('adds a new block to the chain', () => {
            const newData = 'foo-bar';
            blockchain.addBlock({data: newData});

            expect(blockchain.chain[blockchain.chain.length - 1].data).toEqual(newData);
        });
    });

    describe('isValidChain()', () => {
        
        describe('when the chain does not start with the genesis block.', () => {  
            it('returns false', () => {
                blockchain.chain[0] = { data: 'fake-genesis' };

                expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
            });
        });

        describe('when the chain starts with genesis block and has multiple blocks', () => {

            beforeEach(() => {
                blockchain.addBlock({ data: 'foo-bar-1' });
                blockchain.addBlock({ data: 'foo-bar-2' });
                blockchain.addBlock({ data: 'foo-bar-3' });
            });

            describe('when a lastHash reference has changed', () => {   
                it('returns false', () => {
                    blockchain.chain[2].lastHash = 'broken-lastHash';

                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });

            describe('when the chain contains a block with an invalid field', () => {
                it('returns false', () => {
                    blockchain.chain[2].data = 'tampered-data';

                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });

            describe('when the chain contains a block with jumped difficulty', () => {
                it('return false', () => {
                    const lastBlock = blockchain.chain[blockchain.chain.length - 1];
                    const lastHash = lastBlock.hash;
                    const timestamp = Date.now();
                    const nonce = 0;
                    const data = [];
                    const difficulty = lastBlock.difficulty - 3;
                    const hash = cryptoHash(timestamp, data, nonce, difficulty, lastHash);
                    const invalidBlock = new Block({ 
                        timestamp, data, hash, lastHash, difficulty, nonce
                    });

                    blockchain.chain.push(invalidBlock);
                    
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false); 
                });
            });
            describe('when the chain is valid', () => {
                it('returns true', () => {
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(true);
                });
            });
        });
    });

    describe('replaceChain()', () => {
        let errorMock, logMock;

        beforeEach(() => {
            errorMock = jest.fn();
            logMock = jest.fn();

            global.console.error = errorMock;
            global.console.log = logMock;
        });

        describe('when the new chain is not longer', () => {

            beforeEach(() => {
                newChain.chain[0] = { new: 'chain' };
                blockchain.replaceChain(newChain.chain);
            });

            it('does not replace the chain', () => {
                expect(blockchain.chain).toEqual(originalChain);
            });

            it('logs an error', () => {
                expect(errorMock).toHaveBeenCalled();
            });
        });

        describe('when the new chain is longer', () => {

            beforeEach(() => {
                newChain.addBlock({ data: 'foo-bar-1' });
                newChain.addBlock({ data: 'foo-bar-2' });
                newChain.addBlock({ data: 'foo-bar-3' });
            });

            describe('when the chain is invalid', () => {

                beforeEach(() => {
                    newChain.chain[2].hash = 'tampered-value';
                    blockchain.replaceChain(newChain.chain);

                });

                it('does not replace the chain', () => {
                    expect(blockchain.chain).toEqual(originalChain);
                });


                it('logs an error', () => {
                    expect(errorMock).toHaveBeenCalled();
                });
            });

            describe('when the chain is valid', () => {

                beforeEach(() => {
                    blockchain.replaceChain(newChain.chain);
                });

                it('does replace the chain', () => {
                    expect(blockchain.chain).toEqual(newChain.chain);
                });

                it('logs the chain replacement', () => {
                    expect(logMock).toHaveBeenCalled();
                });
            });
        });
    });
});