const cryptoHash = require('./crypto-hash');

describe('cryptoHash()', () => {

    it('get SHA 256 output', () => {
        expect(cryptoHash('foo-bar')).toEqual("291ad95de298fed69e1c8425874cbdf1f4205136978e5e31b7e7e41078b60fc7");
    });

    it('produce same output irrespective of order', () => {
        expect(cryptoHash('one','two','three')).toEqual(cryptoHash('two', 'three', 'one'));
    });

    it('produce unique has when properties change on input', () => {
        const foo = {};
        const originalHash = cryptoHash(foo);
        foo['a'] = 'a';
        expect(cryptoHash(foo)).not.toEqual(originalHash);
    });
}); 