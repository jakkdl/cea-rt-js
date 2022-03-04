import {
  insert, deleteRange,
  createRopeFromMap, rebalance
} from '../../lib/rope'

const createLeaf = (text) => createRopeFromMap({
  text,
  kind: 'leaf'
})

/*
  These tests are here as a starting point, they are not comprehensive
*/
describe("rope basics", () => {
  test("leaf constructor", () => expect(createLeaf('test').toString()).toEqual('test'));
  test("leaf size", () => expect(createLeaf('test').size()).toEqual(4));

  const branch = createRopeFromMap({
    kind: 'branch',
    left: {
      left: {
        kind: 'leaf',
        text: 't'
      },
      right: {
        kind: 'leaf',
        text: 'e'
      },
      kind: 'branch'
    },
    right: {
      kind: 'branch',
      right: {
        kind: 'leaf',
        text: 'st'
      }
    }
  })
  test("branch constructor", () => expect(branch.toString()).toEqual('test'));
  test("branch size", () => expect(branch.size()).toEqual(4));
});

describe("insertion", () => {
  test("insertion 0", () => expect(insert(createLeaf('test'), '123', 0).toString()).toEqual('123test'));
  test("insertion 1", () => expect(insert(createLeaf('test'), '123', 1).toString()).toEqual('t123est'));
  test("insertion 2", () => expect(insert(createLeaf('test'), '123', 2).toString()).toEqual('te123st'));
  test("insertion 3", () => expect(insert(createLeaf('test'), '123', 3).toString()).toEqual('tes123t'));
  test("insertion 4", () => expect(insert(createLeaf('test'), '123', 4).toString()).toEqual('test123'));
  test("weird size insertion", () => expect(insert(createRopeFromMap({kind: 'branch', left: { kind: 'leaf', text: '1'}, right: { kind: 'leaf', text: '2'}}), 'abc', 2).toString()).toEqual('12abc'));
});

const smallBranch = () => createRopeFromMap({
  kind: 'branch',
  left: { kind: 'leaf', text: 'ab' },
  right: { kind: 'leaf', text: 'cd'},
})

describe('insertion smallBranch', () => {
  test("insertion 0", () => expect(insert(smallBranch(), '1', 0).toString()).toEqual('1abcd'));
  test("insertion 1", () => expect(insert(smallBranch(), '1', 1).toString()).toEqual('a1bcd'));
  test("insertion 2", () => expect(insert(smallBranch(), '1', 2).toString()).toEqual('ab1cd'));
  test("insertion 3", () => expect(insert(smallBranch(), '1', 3).toString()).toEqual('abc1d'));
  test("insertion 4", () => expect(insert(smallBranch(), '1', 4).toString()).toEqual('abcd1'));
})

const abcdBranch = () => createRopeFromMap({
    kind: 'branch',
    left: { kind: 'leaf', text: 'a' },
    right: {
      kind: 'branch',
      left: { kind: 'leaf', text: 'b' },
      right: {
        kind: 'branch',
        left: { kind: 'leaf', text: 'c' },
        right: { kind: 'leaf', text: 'd' }
      }
    },
  })
describe("insertion into branch", () => {
  test("branch insertion 0", () => expect(insert(abcdBranch(), '1', 0).toString()).toEqual('1abcd'));
  test("branch insertion 1", () => expect(insert(abcdBranch(), '1', 1).toString()).toEqual('a1bcd'));
  test("branch insertion 2", () => expect(insert(abcdBranch(), '1', 2).toString()).toEqual('ab1cd'));
  test("branch insertion 3", () => expect(insert(abcdBranch(), '1', 3).toString()).toEqual('abc1d'));
  test("branch insertion 4", () => expect(insert(abcdBranch(), '1', 4).toString()).toEqual('abcd1'));
})

const balancedAbcdBranch = () => createRopeFromMap({
    kind: 'branch',
    left: {
      kind: 'branch',
      left: { kind: 'leaf', text: 'a' },
      right: { kind: 'leaf', text: 'b' },
    },
    right: {
      kind: 'branch',
      left: { kind: 'leaf', text: 'c' },
      right: { kind: 'leaf', text: 'd' },
    },
  })
describe("insertion into balanced branch", () => {
  test("branch insertion 0", () => expect(insert(balancedAbcdBranch(), '1', 0).toString()).toEqual('1abcd'));
  test("branch insertion 1", () => expect(insert(balancedAbcdBranch(), '1', 1).toString()).toEqual('a1bcd'));
  test("branch insertion 2", () => expect(insert(balancedAbcdBranch(), '1', 2).toString()).toEqual('ab1cd'));
  test("branch insertion 3", () => expect(insert(balancedAbcdBranch(), '1', 3).toString()).toEqual('abc1d'));
  test("branch insertion 4", () => expect(insert(balancedAbcdBranch(), '1', 4).toString()).toEqual('abcd1'));
})

const abcdefghBranch = () => createRopeFromMap({
    kind: 'branch',
    left: {
      kind: 'branch',
      left: { kind: 'leaf', text: 'ab' },
      right: { kind: 'leaf', text: 'cd' },
    },
    right: {
      kind: 'branch',
      left: { kind: 'leaf', text: 'ef' },
      right: { kind: 'leaf', text: 'gh' },
    },
  })

describe("insertion into two-letter branch", () => {
  test("branch insertion 0", () => expect(insert(abcdefghBranch(), '1', 0).toString()).toEqual('1abcdefgh'));
  test("branch insertion 1", () => expect(insert(abcdefghBranch(), '1', 1).toString()).toEqual('a1bcdefgh'));
  test("branch insertion 2", () => expect(insert(abcdefghBranch(), '1', 2).toString()).toEqual('ab1cdefgh'));
  test("branch insertion 3", () => expect(insert(abcdefghBranch(), '1', 3).toString()).toEqual('abc1defgh'));
  test("branch insertion 4", () => expect(insert(abcdefghBranch(), '1', 4).toString()).toEqual('abcd1efgh'));
  test("branch insertion 5", () => expect(insert(abcdefghBranch(), '1', 5).toString()).toEqual('abcde1fgh'));
  test("branch insertion 6", () => expect(insert(abcdefghBranch(), '1', 6).toString()).toEqual('abcdef1gh'));
  test("branch insertion 7", () => expect(insert(abcdefghBranch(), '1', 7).toString()).toEqual('abcdefg1h'));
  test("branch insertion 8", () => expect(insert(abcdefghBranch(), '1', 8).toString()).toEqual('abcdefgh1'));
})

describe("deletion", () => {
  test("simple deletion", () => expect(deleteRange(createLeaf('abcd'), 1, 3).toString()).toEqual('ad'));
  test("delete until end", () => expect(deleteRange(createLeaf('test'), 2, 4).toString()).toEqual('te'));
  test("delete beginning", () => expect(deleteRange(createLeaf('test'), 0, 2).toString()).toEqual('st'));
  test("delete then insert", () => expect(insert(deleteRange(createLeaf('test'), 1, 3), 'abc', 2).toString()).toEqual('ttabc'));
});

describe('Extra Credit: tree is rebalanced', () => {
  expect(rebalance(createRopeFromMap({
    kind: 'branch',
    left: { kind: 'leaf', text: 'a' },
    right: {
      kind: 'branch',
      left: { kind: 'leaf', text: 'b' },
      right: {
        kind: 'branch',
        left: { kind: 'leaf', text: 'c' },
        right: { kind: 'leaf', text: 'd' }
      }
    },
  }))).toEqual(createRopeFromMap({
    kind: 'branch',
    left: {
      kind: 'branch',
      left: { kind:'leaf',text: 'a' },
      right: { kind:'leaf',text: 'b' }
    },
    right: {
      kind: 'branch',
      left: { kind:'leaf',text: 'c' },
      right: { kind:'leaf',text: 'd' }
    },
  }))
})
