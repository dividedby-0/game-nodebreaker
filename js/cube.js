class Cube {
  constructor() {
    this.blocks = [];
    this.size = 3; // 3x3x3 cube
    this.spacing = 1.5; // Space between blocks
    this.symbols = this.generateSymbols();
    this.initializeBlocks();
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

  getBlock(x, y, z) {
    return this.blocks[x * this.size * this.size + y * this.size + z];
  }

  addToScene(scene) {
    this.blocks.forEach((block) => {
      scene.add(block.mesh);
    });
  }
}
