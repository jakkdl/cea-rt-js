/*
  Note: this file is in typescript, but you do not need to use typings if you don't want.

  The type annotations are just there in case they are helpful.
*/
type MapBranch = {
  left?: MapRepresentation,
  right?: MapRepresentation,
  size: number,
  kind: 'branch'
}
type MapLeaf = {
  text: string,
  kind: 'leaf'
}
type MapRepresentation = MapBranch | MapLeaf

interface IRope {
  toString: () => string,
  size: () => number,
  height: () => number,
  toMap: () => MapRepresentation,
  isBalanced: () => Boolean
}

export class RopeLeaf implements IRope {
  text: string;

  // Note: depending on your implementation, you may want to to change this constructor
  constructor(text: string) {
    this.text = text;
  }

  // just prints the stored text
  toString(): string {
    return this.text
  }

  size() {
    return this.text.length;
  }

  height() {
    return 1;
  }

  toMap(): MapLeaf {
    return {
      text: this.text,
      kind: 'leaf'
    }
  }

  isBalanced() {
    return true;
  }
}

export class RopeBranch implements IRope {
  left: IRope;
  right: IRope;
  cachedSize: number;

  constructor(left: IRope, right: IRope) {
    this.left = left;
    this.right = right;
    // Please note that this is defined differently from "weight" in the Wikipedia article.
    // You may wish to rewrite this property or create a different one.
    this.setSize();
  }

  setSize() {
    this.cachedSize = (this.left ? this.left.size() : 0) +
      (this.right ? this.right.size() : 0)
  }

  // how deep the tree is (I.e. the maximum depth of children)
  height(): number {
    return 1 + Math.max(this.leftHeight(), this.rightHeight())
  }

  // Please note that this is defined differently from "weight" in the Wikipedia article.
  // You may wish to rewrite this method or create a different one.
  size() {
    return this.cachedSize;
  }

  /*
    Whether the rope is balanced, i.e. whether any subtrees have branches
    which differ by more than one in height.
  */
  isBalanced(): boolean {
    const leftBalanced = this.left ? this.left.isBalanced() : true
    const rightBalanced = this.right ? this.right.isBalanced() : true

    return leftBalanced && rightBalanced
      && Math.abs(this.leftHeight() - this.rightHeight()) < 2
  }

  leftHeight(): number {
    if (!this.left) return 0
    return this.left.height()
  }

  rightHeight(): number {
    if (!this.right) return 0
    return this.right.height()
  }

  // Helper method which converts the rope into an associative array
  //
  // Only used for debugging, this has no functional purpose
  toMap(): MapBranch {
    const mapVersion: MapBranch = {
      size: this.size(),
      kind: 'branch'
    }
    if (this.right) mapVersion.right = this.right.toMap()
    if (this.left) mapVersion.left = this.left.toMap()
    return mapVersion
  }

  toString(): string {
    return (this.left ? this.left.toString() : '')
      + (this.right ? this.right.toString() : '')
  }
}


export function createRopeFromMap(map: MapRepresentation): IRope {
  if (map.kind == 'leaf') {
    return new RopeLeaf(map.text)
  }

  let left, right = null;
  if (map.left) left = createRopeFromMap(map.left)
  if (map.right) right = createRopeFromMap(map.right)
  return new RopeBranch(left, right);
}

// This is an internal API. You can implement it however you want.
// (E.g. you can choose to mutate the input rope or not)
// We put character @ position in the right tree
function splitAt(rope: IRope, position: number): [IRope, IRope] {
  if (rope instanceof RopeLeaf) {
    const right = new RopeLeaf(rope.text.slice(position));
    rope.text = rope.text.slice(0, position);
    return [rope, right];
  }

  if (!(rope instanceof RopeBranch)) {
    throw Error('unknown IRope')
  }

  let resLeft: IRope;
  let resRight: IRope;

  // go left
  if (rope.size() > position) {
    [resLeft, resRight] = splitAt(rope.left, position);
    const right = new RopeBranch(resRight, rope.right);
    // modify our size
    rope.cachedSize -= resRight.size();
    // remove our child
    rope.right = resLeft;
    return [rope, right];
  }

  // go right
  const newPosition = position - (rope.left !== undefined ? rope.left.size() : 0);
  [resLeft, resRight] = splitAt(rope.right, newPosition);
  rope.right = resLeft;

  return [rope, resRight];
}

function concat(left: IRope, right: IRope): IRope {
  return new RopeBranch(left, right);
}

export function deleteRange(rope: IRope, start: number, end: number): IRope {
  const [left, remaining] = splitAt(rope, start);
  const right = splitAt(remaining, end - start)[1];
  return concat(left, right);
}

export function insert(rope: IRope, text: string, location: number): IRope {
  const [left, right] = splitAt(rope, location);
  const newRight = concat(new RopeLeaf(text), right);
  return concat(left, newRight);
}

// I said I'd commit a new rebalance in a new branch, but I figured it's easier for you
// to have it in the same file. But this function was finished approximately an hour
// after I'd submitted my code. Up to you if you just want to ignore it, but I couldn't
// resist figuring it out.
// There's also some very minor refactoring in the remaining code, you can check the commit diff (or checkout that specific commit) if you want to see what it was.
export function rebalance(rope: IRope): IRope {
  if (!(rope instanceof RopeBranch)) {
    return rope;
  }

  rope.left = rebalance(rope.left);
  rope.right = rebalance(rope.right);

  // the higher child must be a RopeBranch
  let highChild: () => RopeBranch;
  // let lowChild: () => IRope;

  // Check if left or right is sufficiently larger, and if so set functions to access
  if (rope.leftHeight() > rope.rightHeight() + 1) {
    console.log('left higher')
    highChild = () => <RopeBranch>rope.left;
    // lowChild = () => rope.right;
  } else if (rope.rightHeight() > rope.leftHeight() + 1) {
    console.log('right higher')
    highChild = () => <RopeBranch>rope.right;
    // lowChild = () => rope.left;
  } else {
    return rope;
  }

  // Figure out if any subtree of highChild() is higher, so as not to need to rebalance again.
  let higher: IRope;
  let lower: IRope;
  if (highChild().leftHeight() > highChild().rightHeight()) {
    higher = highChild().left;
    lower = highChild().right;
  } else {
    higher = highChild().right;
    lower = highChild().left;
  }


  const newRoot = highChild();

  // Shuffle around the actual nodes.
  // highChild becomes the new root node, with one of it's nodes (depending on if highChild is left or right) swapped with the old root node.
  // it should be possible to do this without an extra if statement, but I've yet to figure out how to do it cleanly in js.
  if (rope.leftHeight() > rope.rightHeight()) {
    rope.left = lower;
    newRoot.left = higher;
    newRoot.right = rope;
  }
  else {
    rope.right = lower;
    newRoot.right = higher;
    newRoot.left = rope;
  }

  // Update the cached size.
  rope.setSize();
  newRoot.setSize();
  return newRoot;
}
