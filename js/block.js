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

    // Create canvas textures for each face of a block
    const materials = Array(6)
      .fill()
      .map(() => {
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext("2d");

        // Black background
        context.fillStyle = "#000000";
        context.fillRect(0, 0, 128, 128);

        // Add invisible character initially
        context.fillStyle = "#000000";
        context.font = "130px VT323";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(this.symbol, 64, 64);

        const texture = new THREE.CanvasTexture(canvas);
        return new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0.9,
        });
      });

    // Create the mesh with geometry and materials
    const mesh = new THREE.Mesh(geometry, materials);

    // Create tube geometry around edges for thicker edge lines
    const edgesGeometry = new THREE.EdgesGeometry(geometry);
    const points = [];
    const edgePositions = edgesGeometry.attributes.position.array;
    for (let i = 0; i < edgePositions.length; i += 3) {
      points.push(
        new THREE.Vector3(
          edgePositions[i],
          edgePositions[i + 1],
          edgePositions[i + 2]
        )
      );
    }

    for (let i = 0; i < points.length; i += 2) {
      const tubeGeometry = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([points[i], points[i + 1]]),
        1, // path segments
        0.02, // thickness
        8, // roundness segments
        false // closed
      );
      const tubeMesh = new THREE.Mesh(
        tubeGeometry,
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
      );
      mesh.add(tubeMesh);
    }

    mesh.position.set(this.position.x, this.position.y, this.position.z);
    return mesh;
  }

  reveal() {
    this.isRevealed = true;
    this.updateAppearance();
  }

  hide() {
    this.isRevealed = false;
    // this.fadeOut();
    this.updateAppearance();
  }

  fadeOut() {
    const targetColor = 0x000000;
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
    this.mesh.material.forEach((material) => {
      const canvas = material.map.image;
      const context = canvas.getContext("2d");

      // Clear canvas
      context.fillStyle = "#000000";
      context.fillRect(0, 0, 128, 128);

      // Draw character
      context.fillStyle = this.isRevealed ? "#00ff00" : "#000000";
      context.font = "130px VT323";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(this.symbol, 64, 64);

      material.map.needsUpdate = true;
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
