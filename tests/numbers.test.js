const numbers = require('../numbers')

describe('add', () => {
    test('Should be 5', () => {
    const result = numbers.add(1, 4);
    expect(result).toBe(5);
    });

test('Big Number', () => {
    const result = numbers.add(1, 10);
    expect(result).toBe(11);
    });
});

describe('greet', () => {
   test('Welcome Aviv', () => {
       const aviv = numbers.greet('Aviv');
        expect(aviv).toBe('Welcome Aviv');
})
});
