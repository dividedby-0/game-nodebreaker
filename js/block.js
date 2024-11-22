class Block {
  constructor(position, symbol) {
    this.position = position;
    this.symbol = symbol;
    this.isRevealed = false;
    this.mesh = this.createMesh();
  }

  createMesh() {
    // Create a cube geometry
    const geometry = new THREE.BoxGeometry(1, 1, 1);

    // Create materials for all six faces (same symbol on all faces)
    const materials = Array(6)
      .fill()
      .map(
        () =>
          new THREE.MeshBasicMaterial({
            color: 0x808080, // Default hidden color
            wireframe: false,
          })
      );

    // Create the mesh with geometry and materials
    const mesh = new THREE.Mesh(geometry, materials);
    mesh.position.set(this.position.x, this.position.y, this.position.z);

    return mesh;
  }

  reveal() {
    this.isRevealed = true;
    this.updateAppearance();
  }

  hide() {
    this.isRevealed = false;
    this.updateAppearance();
  }

  updateAppearance() {
    const color = this.isRevealed ? this.symbol : 0x808080;
    this.mesh.material.forEach((material) => {
      material.color.setHex(color);
    });
  }
}
