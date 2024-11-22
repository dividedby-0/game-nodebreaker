class Game {
  constructor() {
    this.container = document.getElementById("game-container");
    this.score = 0;
    this.selectedBlocks = [];
    this.setupScene();
    this.setupCamera();
    this.setupRenderer();
    this.setupCube();
    this.setupRaycaster();
    this.setupEventListeners();
    this.animate();
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(4, 4, 4);
    this.camera.lookAt(0, 0, 0);
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
      this.score += 10;
      document.getElementById("score-value").textContent = this.score;
      this.selectedBlocks = [];
    } else {
      setTimeout(() => {
        block1.hide();
        block2.hide();
        this.selectedBlocks = [];
      }, 1000);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }
}

// Start the game when the page loads
window.addEventListener("load", () => {
  new Game();
});
