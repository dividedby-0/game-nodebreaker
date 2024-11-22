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
    const colors = [
      0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xff8000,
      0x8000ff, 0x00ff80, 0xff0080, 0x0080ff, 0x80ff00, 0x808080,
    ];

    // Create array with exactly 27 elements (13 pairs + 1 unique repeated 1 more time)
    const pairs = [
      ...colors.slice(0, -1), // First 12 colors
      ...colors.slice(0, -1), // Repeat first 12 colors
      colors[colors.length - 1], // Add unique color
      colors[colors.length - 1], // Repeat unique color
      colors[0], // Add one more color to reach 27
    ].sort(() => Math.random() - 0.5);

    return pairs;
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
