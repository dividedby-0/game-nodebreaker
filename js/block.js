class Block {
  constructor(position, symbol) {
    this.position = position;
    this.symbol = symbol;
    this.isRevealed = false;
    this.mesh = this.createMesh();
    this.currentColor = 0x808080;
  }

  createMesh() {
    // Create a cube geometry
    const geometry = new THREE.BoxGeometry(1, 1, 1);

    // Create materials for all six faces
    const materials = Array(6)
      .fill()
      .map(
        () =>
          new THREE.MeshBasicMaterial({
            color: 0xd3d3d3,
            wireframe: false,
          })
      );

    // Create the mesh with geometry and materials
    const mesh = new THREE.Mesh(geometry, materials);

    // Add edges to make the structure visible
    const edgesGeometry = new THREE.EdgesGeometry(geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000 }); // Black edges
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);

    mesh.add(edges); // Add edges as a child of the mesh
    mesh.position.set(this.position.x, this.position.y, this.position.z);

    return mesh;
  }

  reveal() {
    this.isRevealed = true;
    this.updateAppearance();
  }

  hide() {
    this.isRevealed = false;
    this.fadeOut();
  }

  fadeOut() {
    const targetColor = 0xebebeb;
    const startColor = this.symbol;
    const duration = 500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const currentR = this.lerp(
        (startColor >> 16) & 255,
        (targetColor >> 16) & 255,
        progress
      );
      const currentG = this.lerp(
        (startColor >> 8) & 255,
        (targetColor >> 8) & 255,
        progress
      );
      const currentB = this.lerp(startColor & 255, targetColor & 255, progress);

      const color = (currentR << 16) | (currentG << 8) | currentB;

      this.mesh.material.forEach((material) => {
        material.color.setHex(color);
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  lerp(start, end, progress) {
    return Math.round(start + (end - start) * progress);
  }

  updateAppearance() {
    const color = this.isRevealed ? this.symbol : 0xffffff; // White when hidden
    this.mesh.material.forEach((material) => {
      material.color.setHex(color);
    });
  }

  remove() {
    this.animateRemoval();
  }

  animateRemoval() {
    const duration = 500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Scale down
      const scale = 1 - progress;
      this.mesh.scale.set(scale, scale, scale);

      // Fade out
      this.mesh.material.forEach((material) => {
        material.opacity = 1 - progress;
        material.transparent = true;
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Make block non-interactive after animation
        this.mesh.visible = false;
        this.isRevealed = true;
        this.mesh.renderOrder = -1;
        this.mesh.raycast = () => {};
      }
    };

    animate();
  }
}
