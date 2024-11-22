class Cube {
  constructor() {
    this.blocks = [];
    this.size = 3; // 3x3x3 cube
    this.spacing = 1.01; // Space between blocks
    this.symbols = this.generateSymbols();
    this.initializeBlocks();
  }

  generateSymbols() {
    // Generate 13 pairs of colors (26 total) plus 1 unique color
    // Generate 9 triplets of colors (27 total for 3x3x3 cube)
    const colors = [
      0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xff8000,
      0x8000ff, 0x00ff80,
    ];

    // Triple each color and shuffle
    const triplets = [...colors, ...colors, ...colors].sort(
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
