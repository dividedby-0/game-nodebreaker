class Game {
  constructor() {
    this.container = document.getElementById("game-container");
    this.score = 0;
    this.selectedBlocks = [];
    this.setupScene();
    this.setupCamera();
    this.setupRenderer();
    this.setupControls();
    this.setupCube();
    this.setupRaycaster();
    this.setupEventListeners();
    this.animate();
    this.isProcessing = false;
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffeded);
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(1, 1, 1); // initial view
    this.camera.lookAt(0, 0, 0);
  }

  setupControls() {
    this.controls = new THREE.OrbitControls(
      this.camera,
      this.renderer.domElement
    );
    this.controls.enableDamping = true; // smooth rotation
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = 0.5; // slower rotation
    this.controls.enablePan = false; // Disable panning
    this.controls.minDistance = 7; // Min zoom
    this.controls.maxDistance = 10; // Max zoom
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);
  }

  setupCube() {
    this.cube = new Cube();
    this.cube.addToScene(this.scene);
  }

  setupRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  setupEventListeners() {
    window.addEventListener("resize", () => this.onWindowResize(), false);
    this.renderer.domElement.addEventListener(
      "click",
      (event) => this.onMouseClick(event),
      false
    );
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onMouseClick(event) {
    if (this.isProcessing) return;

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children);

    if (intersects.length > 0) {
      const clickedBlock = this.cube.blocks.find(
        (block) => block.mesh === intersects[0].object
      );
      if (clickedBlock && !clickedBlock.isRevealed) {
        this.handleBlockClick(clickedBlock);
      }
    }
  }

  handleBlockClick(block) {
    block.reveal();
    this.selectedBlocks.push(block);

    if (this.selectedBlocks.length === 2) {
      this.checkMatch();
    }
  }

  checkMatch() {
    const [block1, block2] = this.selectedBlocks;

    if (block1.symbol === block2.symbol) {
      this.isProcessing = true;
      this.score += 10;
      document.getElementById("score-value").textContent = this.score;
      setTimeout(() => {
        block1.remove();
        block2.remove();
        this.selectedBlocks = [];
        this.isProcessing = false;
      }, 500);
    } else {
      this.isProcessing = true;
      setTimeout(() => {
        block1.hide();
        block2.hide();
        this.selectedBlocks = [];
        this.isProcessing = false;
      }, 500);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update(); // Update controls in animation loop
    this.renderer.render(this.scene, this.camera);
  }
}

// Start the game when the page loads
window.addEventListener("load", () => {
  new Game();
});
