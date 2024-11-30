class Cube {
  constructor() {
    this.blocks = [];
    this.size = 4;
    this.spacing = 3;
    this.symbols = this.generateSymbols();
    this.initializeBlocks();
    // Initialize the graph structure using the block connections
    this.graph = {
      findValidMoves: (block) => {
        // Return all connected blocks that haven't been selected
        return Array.from(block.connections).filter(
          (connectedBlock) =>
            !connectedBlock.isSelected && !connectedBlock.isBreakable
        );
      },
    };
    this.setupBlockConnections();
    this.nonClickableBlockCount = 2;
    this.breakerBlockCount = 2;
    this.setRandomNonClickableBlocks();
    this.setRandomBreakerBlocks();
  }

  setRandomBreakerBlocks() {
    // Create array of indices and shuffle it
    const indices = [...Array(this.blocks.length).keys()].filter(
      (i) => !this.blocks[i].isBreakable
    ); // Exclude non-clickable blocks

    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // Set the first 2 blocks as special
    for (let i = 0; i < this.breakerBlockCount; i++) {
      const blockIndex = indices[i];
      this.blocks[blockIndex].isBreaker = true;
      this.blocks[blockIndex].updateAppearance();
    }
  }

  setRandomNonClickableBlocks() {
    // Create array of indices and shuffle it
    const indices = [...Array(this.blocks.length).keys()];
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // Set the first n blocks as non-clickable
    for (let i = 0; i < this.nonClickableBlockCount; i++) {
      const blockIndex = indices[i];
      this.blocks[blockIndex].isBreakable = true;
      this.blocks[blockIndex].updateAppearance();
    }
  }

  setupBlockConnections() {
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        for (let z = 0; z < this.size; z++) {
          const currentBlock = this.getBlock(x, y, z);

          // Check all 6 adjacent directions
          const directions = [
            { x: x + 1, y, z },
            { x: x - 1, y, z },
            { x, y: y + 1, z },
            { x, y: y - 1, z },
            { x, y, z: z + 1 },
            { x, y, z: z - 1 },
          ];

          directions.forEach((dir) => {
            if (this.isValidPosition(dir.x, dir.y, dir.z)) {
              const adjacentBlock = this.getBlock(dir.x, dir.y, dir.z);
              currentBlock.addConnection(adjacentBlock);
              adjacentBlock.addConnection(currentBlock); // Bi-directional connection
            }
          });
        }
      }
    }
  }

  isValidPosition(x, y, z) {
    return (
      x >= 0 &&
      x < this.size &&
      y >= 0 &&
      y < this.size &&
      z >= 0 &&
      z < this.size
    );
  }

  findValidNextMoves(block) {
    // Get valid moves from the block's connections Set
    const validMoves = Array.from(block.connections).filter(
      (connectedBlock) =>
        !connectedBlock.isSelected && !connectedBlock.isBreakable
    );

    // Reset all blocks' valid state
    this.blocks.forEach((b) => {
      b.isValid = false;
      b.updateAppearance();
    });

    // Mark valid moves
    validMoves.forEach((validBlock) => {
      validBlock.isValid = true;
      validBlock.updateAppearance();
    });
  }

  removeBlock(block) {
    this.graph.removeNode(block);
    const index = this.blocks.indexOf(block);
    if (index > -1) {
      this.blocks.splice(index, 1);
    }
  }

  getBlock(x, y, z) {
    return this.blocks[x * this.size * this.size + y * this.size + z];
  }

  // TODO repurpose or remove
  generateSymbols() {
    const blockChars = [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
    ];

    const quadruplets = [
      ...blockChars,
      ...blockChars,
      ...blockChars,
      ...blockChars,
    ].sort(() => Math.random() - 0.5);

    return quadruplets;
  }

  initializeBlocks() {
    let symbolIndex = 0;

    // Create blocks for each position in the 4x4x4 grid
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        for (let z = 0; z < this.size; z++) {
          const position = {
            x: (x - (this.size - 1) / 2) * this.spacing,
            y: (y - (this.size - 1) / 2) * this.spacing,
            z: (z - (this.size - 1) / 2) * this.spacing,
          };
          const block = new Block(position, this.symbols[symbolIndex]);
          this.blocks.push(block);
          symbolIndex++;
        }
      }
    }
  }

  addToScene(scene) {
    this.blocks.forEach((block) => {
      scene.add(block.mesh);
    });
  }
}
