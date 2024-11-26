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
    this.scoreElement = new TerminalText("score", {});
    this.timerElement = new TerminalText("timer", {});
  }

  async initializeUI() {
    await this.scoreElement.typeText(
      "Score: 0",
      document.getElementById("score")
    );
    await this.timerElement.typeText(
      "Time: 0",
      document.getElementById("timer")
    );
  }

  setupEventListeners() {
    this.isDragging = false;
    this.dragStartTime = 0;
    this.dragStartPosition = { x: 0, y: 0 };

    // Window resize
    window.addEventListener("resize", () => this.onWindowResize(), false);

    // Mouse events
    this.renderer.domElement.addEventListener(
      "pointerdown",
      (event) => this.onPointerDown(event),
      false
    );
    this.renderer.domElement.addEventListener(
      "pointerup",
      (event) => this.onPointerUp(event),
      false
    );
    this.renderer.domElement.addEventListener(
      "pointermove",
      (event) => this.onPointerMove(event),
      false
    );

    // Touch events
    this.renderer.domElement.addEventListener(
      "touchstart",
      (event) => {
        event.preventDefault();
        this.handleTouchStart(event);
      },
      false
    );

    this.renderer.domElement.addEventListener(
      "touchend",
      (event) => {
        event.preventDefault();
        this.handleTouchEnd(event);
      },
      false
    );

    this.renderer.domElement.addEventListener(
      "touchmove",
      (event) => {
        event.preventDefault();
        this.handleTouchMove(event);
      },
      false
    );
  }

  // Pointer actions
  onPointerDown(event) {
    this.isPointerDown = true;
    this.pointerMoved = false;
  }

  onPointerMove(event) {
    if (this.isPointerDown) {
      this.pointerMoved = true;
    }
  }

  onPointerUp(event) {
    if (!this.pointerMoved) {
      this.handleClick(event);
    }
    this.isPointerDown = false;
    this.pointerMoved = false;
  }

  // Initial setup
  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
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
    this.camera.position.set(4, 4, 4); // initial view
    this.camera.lookAt(0, 0, 0);
  }

  setupControls() {
    this.controls = new THREE.OrbitControls(
      this.camera,
      this.renderer.domElement
    );
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = 0.6;
    this.controls.enablePan = false;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 15;

    // Mobile-specific control adjustments
    if (this.isMobileDevice()) {
      this.controls.rotateSpeed = 0.8;
      this.controls.enableZoom = true; // pinch-to-zoom
      this.controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      };
    }
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

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  handleClick(event) {
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
    // Ignore if block is already connected (selected)
    if (block.isSelected || this.selectedBlocks.includes(block)) {
      return;
    }

    // If this is not the first block, check if it's connected to the last selected block
    if (this.selectedBlocks.length > 0) {
      const lastSelectedBlock =
        this.selectedBlocks[this.selectedBlocks.length - 1];
      if (!lastSelectedBlock.connectedTo.includes(block)) {
        return; // Ignore click if not a valid connected block
      }
    }

    // Select the block
    block.isSelected = true;
    block.updateAppearance();
    this.selectedBlocks.push(block);

    // Clear previous valid moves
    this.cube.blocks.forEach((b) => {
      b.isValid = false;
      b.updateAppearance();
    });

    // Show valid moves for next selection
    this.cube.findValidNextMoves(block);

    this.handleSuccessfulConnection();
  }

  // When you confirm a successful connection, call it like this:
  handleSuccessfulConnection() {
    this.selectedBlocks.forEach((block) => {
      this.removeBlock(block);
    });
    this.selectedBlocks = [];
  }

  removeBlock(block) {
    const blinkCount = 3;
    const blinkDuration = 100; // ms per blink

    // Blink animation
    let currentBlink = 0;
    const blinkInterval = setInterval(() => {
      block.mesh.visible = !block.mesh.visible;
      currentBlink++;

      if (currentBlink >= blinkCount * 2) {
        // *2 because each blink is two states
        clearInterval(blinkInterval);
        block.mesh.visible = true;

        // Final cleanup after blinking
        this.scene.remove(block.mesh);
        const index = this.cube.blocks.indexOf(block);
        if (index > -1) {
          this.cube.blocks.splice(index, 1);
        }
        block.connectedTo = [];
        block.mesh.geometry.dispose();
        block.mesh.material.dispose();
      }
    }, blinkDuration);
  }

  // Touch events handling for mobile
  handleTouchStart(event) {
    this.touchStartTime = Date.now();
    this.touchStartPosition = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  }

  handleTouchMove(event) {
    if (!this.touchStartPosition) return;

    const deltaX = event.touches[0].clientX - this.touchStartPosition.x;
    const deltaY = event.touches[0].clientY - this.touchStartPosition.y;

    // If movement is significant, mark as dragging
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      this.isDragging = true;
    }
  }

  handleTouchEnd() {
    // Reset touch tracking
    this.touchStartPosition = null;
    this.isDragging = false;
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update(); // Update controls in animation loop
    this.renderer.render(this.scene, this.camera);
  }
}

// Start the game when the page loads
window.addEventListener("load", async () => {
  const game = new Game();
  await game.initializeUI();
});
