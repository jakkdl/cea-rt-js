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

  leftSize() {
    return (this.left ? this.left.size() : 0);
  }

  rightSize() {
    return (this.right ? this.right.size() : 0);
  }

  setSize() {
    this.cachedSize = this.leftSize() + this.rightSize();
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

// We put character @ "position" in the right tree
function splitAt(rope: IRope, position: number): {left: IRope, right: IRope} {
  let newRight: IRope;

  if (rope instanceof RopeLeaf) {
    newRight = new RopeLeaf(rope.text.slice(position));
    rope.text = rope.text.slice(0, position);
  }
  else if (!(rope instanceof RopeBranch)) {
      throw Error('unknown IRope')
  } else {
    if (rope.leftSize() > position) {
      // go left
      const {left, right} = splitAt(rope.left, position);
      newRight = new RopeBranch(right, rope.right);

      // update left with what's left of it
      rope.left = left;
      // remove our child
      rope.right = null;
    } else {
      // go right
      const newPosition = position - rope.leftSize();
      const {left, right} = splitAt(rope.right, newPosition);
      newRight = right;
      rope.right = left;
    }
    // modify our size
    rope.cachedSize -= newRight.size();
  }

  return {left: rope, right: newRight};
}

function concat(left: IRope, right: IRope): IRope {
  return new RopeBranch(left, right);
}

export function deleteRange(rope: IRope, start: number, end: number): IRope {
  const {left, right} = splitAt(rope, start);
  const newRight = splitAt(right, end - start).right;
  return concat(left, newRight);
}

export function insert(rope: IRope, text: string, location: number): IRope {
  const {left, right} = splitAt(rope, location);
  const newRight = concat(new RopeLeaf(text), right);
  return concat(left, newRight);
}

// basic working version finished after an hour, final pretty version after 90 minutes
// except it would've shuffled around the text in the string in some cases ... took me another 10 minutes to fix.
export function rebalance(rope: IRope): IRope {
  if (!(rope instanceof RopeBranch)) {
    return rope;
  }

  rope.left = rebalance(rope.left);
  rope.right = rebalance(rope.right);

  let higher: string;
  let lower: string;

  // Check if left or right is sufficiently larger, and if so set strings to access
  if (rope.leftHeight() > rope.rightHeight() + 1) {
    higher = 'left';
    lower = 'right';
  } else if (rope.rightHeight() > rope.leftHeight() + 1) {
    higher = 'right';
    lower = 'left';
  } else {
    return rope;
  }

  // Shuffle around the actual nodes.
  const newRoot = rope[higher];
  rope[higher] = newRoot[lower];
  newRoot[lower] = rope;

  // Update the cached sizes.
  rope.setSize();
  newRoot.setSize();
  return newRoot;
}
