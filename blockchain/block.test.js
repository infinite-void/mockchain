const Block = require('./block');
const { cryptoHash } = require('../utils');
const hexToBinary = require('hex-to-binary');
const { GENESIS_DATA, MINE_RATE } = require('../config');

describe('Block', () => {
    const timestamp = 2000;
    const lastHash = 'foo-lastHash';
    const hash = 'foo-hash';
    const data = ['blockchain', 'data'];
    const nonce = 1;
    const difficulty = 1;
    const block = new Block({ timestamp, lastHash, hash, data, nonce, difficulty });

    describe('block()', () => {
        it('has all properties', () => {
            expect(block.timestamp).toEqual(timestamp);
            expect(block.lastHash).toEqual(lastHash);
            expect(block.hash).toEqual(hash);
            expect(block.data).toEqual(data);
            expect(block.nonce).toEqual(nonce);
            expect(block.difficulty).toEqual(difficulty);
        });
    });

    describe('genesis()', ()=> {
        const genesisBlock = Block.genesis();

        it('returns a block', () => {
            expect(genesisBlock instanceof Block).toBe(true);
        });

        it('bloc contains genesis data', () => {
            expect(genesisBlock).toEqual(GENESIS_DATA);
        });
    });

    describe('mineBlock()', () => {
        const lastBlock = Block.genesis();
        const data = 'mined data';
        const minedBlock = Block.mineBlock( { lastBlock, data});

        it('returns a block', () => {
            expect(minedBlock instanceof Block).toEqual(true);
        });

        it('check the `lastHash`', () => {
            expect(minedBlock.lastHash).toEqual(lastBlock.hash);
        });
        
        it('check the `timestamp`', () => {
            expect(minedBlock.timestamp).not.toEqual(undefined);
        });

        it('check the `data`', () => {
            expect(minedBlock.data).toEqual(data);
        });

        it('generate sha-256 hash for block', () => {
            expect(minedBlock.hash).toEqual(cryptoHash(
                minedBlock.timestamp,
                minedBlock.nonce,
                minedBlock.difficulty,
                minedBlock.lastHash,
                data)
            );
        });

        it('sets the `hash` to meet the difficulty criteria', () => {
            expect(hexToBinary(minedBlock.hash).substring(0, minedBlock.difficulty))
            .toEqual('0'.repeat(minedBlock.difficulty));
        });

        it('adjust the difficulty', () => {
            const possibleDifficulties = [lastBlock.difficulty - 1, lastBlock.difficulty + 1];

            expect(possibleDifficulties.includes(minedBlock.difficulty)).toBe(true); 
        });
    });

    describe('adjustDifficulty()', () => {

        it('raises the difficulty for a fast mined block', () => {
            expect(Block.adjustDifficulty({ 
                originalBlock: block, timestamp: timestamp + MINE_RATE - 100
            })).toEqual(block.difficulty + 1);
        });

        it('lowers the difficulty for a slow mined block', () => {
            expect(Block.adjustDifficulty({
                originalBlock: block, timestamp: block.timestamp + MINE_RATE + 100
            })).toEqual(block.difficulty - 1);
        });

        it('has a lower limit of 1', () => {
            block.difficulty = -1;

            expect(Block.adjustDifficulty({ originalBlock: block})).toEqual(1);
        });
    });
});
