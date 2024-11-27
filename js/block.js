class Block {
  constructor(position) {
    this.position = position;
    this.isVisited = false;
    this.isSelected = false;
    this.isValid = false; // For highlighting valid next moves
    this.isBreakable = false;
    this.isBreaker = false;
    this.connectedTo = []; // Store connected blocks
    this.mesh = this.createMesh();
  }

  createMesh() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 1,
      wireframe: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(this.position.x, this.position.y, this.position.z);

    // Add edge highlighting
    const edgesGeometry = new THREE.EdgesGeometry(geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    mesh.add(edges);

    return mesh;
  }

  lerp(start, end, progress) {
    return Math.round(start + (end - start) * progress);
  }

  updateAppearance() {
    if (this.isBreakable) {
      this.mesh.material.color.setHex(0xff0000); // Red for non-clickable
    } else if (this.isSelected && this.isBreaker) {
      this.mesh.material.color.setHex(0xffff00); // Yellow for selected breaker blocks
    } else if (this.isSelected) {
      this.mesh.material.color.setHex(0x0000ff); // Blue for selected normal blocks
    } else if (this.isValid && this.isBreaker) {
      this.mesh.material.color.setHex(0xffff00); // Keep yellow for valid breaker blocks
    } else if (this.isValid) {
      this.mesh.material.color.setHex(0x0000ff); // Blue for valid moves
    } else if (this.isBreaker) {
      this.mesh.material.color.setHex(0xffff00); // Default breaker color
    } else {
      this.mesh.material.color.setHex(0x000000); // Default
    }
  }
}
