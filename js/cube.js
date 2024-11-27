class Cube {
  constructor() {
    this.blocks = [];
    this.size = 4; // Change from 3 to 4 for 4x4x4 cube
    this.spacing = 3;
    this.symbols = this.generateSymbols();
    this.initializeBlocks();
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
    // Establish connections between adjacent blocks
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        for (let z = 0; z < this.size; z++) {
          const currentBlock = this.getBlock(x, y, z);

          // Check all 6 possible directions
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
              if (!currentBlock.connectedTo.includes(adjacentBlock)) {
                currentBlock.connectedTo.push(adjacentBlock);
              }
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
    // Reset all blocks' valid state
    this.blocks.forEach((b) => (b.isValid = false));

    // Mark all connected blocks as valid moves, except breakers and non-clickable blocks
    block.connectedTo.forEach((connectedBlock) => {
      if (
        !connectedBlock.isRevealed &&
        !connectedBlock.isSelected &&
        !connectedBlock.isBreakable
      ) {
        connectedBlock.isValid = true;
        connectedBlock.updateAppearance();
      }
    });
  }

  getBlock(x, y, z) {
    return this.blocks[x * this.size * this.size + y * this.size + z];
  }

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

    // Create blocks for each position in the 3x3x3 grid
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
