class Cube {
  constructor() {
    this.blocks = [];
    this.size = 3; // 3x3x3 cube
    this.spacing = 1.5; // Space between blocks
    this.symbols = this.generateSymbols();
    this.initializeBlocks();
    this.setupBlockConnections();
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

    // Mark all connected blocks as valid moves
    block.connectedTo.forEach((connectedBlock) => {
      if (!connectedBlock.isRevealed && !connectedBlock.isSelected) {
        connectedBlock.isValid = true;
        connectedBlock.updateAppearance();
      }
    });
  }

  getBlock(x, y, z) {
    return this.blocks[x * this.size * this.size + y * this.size + z];
  }

  generateSymbols() {
    const blockChars = ["A", "B", "C", "D", "E", "F", "1", "2", "3"];

    // Triple each character and shuffle
    const triplets = [...blockChars, ...blockChars, ...blockChars].sort(
      () => Math.random() - 0.5
    );

    return triplets;
  }

  initializeBlocks() {
    let symbolIndex = 0;

    // Create blocks for each position in the 3x3x3 grid
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        for (let z = 0; z < this.size; z++) {
          const position = {
            x: (x - 1) * this.spacing,
            y: (y - 1) * this.spacing,
            z: (z - 1) * this.spacing,
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
