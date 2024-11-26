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
    this.camera.lookAt(0, 0, 0);
    this.animateInitialCamera();
  }

  animateInitialCamera() {
    const startPosition = {
      x: Math.random() * 5,
      y: Math.random() * 5,
      z: Math.random() * 5,
    };
    const endPosition = { x: 10, y: 10, z: 10 };
    const duration = 2000; // Duration in milliseconds
    const startTime = Date.now();

    const animateCamera = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Use smooth easing
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      this.camera.position.set(
        startPosition.x + (endPosition.x - startPosition.x) * easeProgress,
        startPosition.y + (endPosition.y - startPosition.y) * easeProgress,
        startPosition.z + (endPosition.z - startPosition.z) * easeProgress
      );

      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      } else {
        this.controls.enabled = true;
      }
    };

    animateCamera();
  }

  setupControls() {
    this.controls = new THREE.OrbitControls(
      this.camera,
      this.renderer.domElement
    );
    this.controls.enabled = false;
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
      const raycasterFoundBlock = intersects.find(
        (intersect) => intersect.face !== null
      );
      if (raycasterFoundBlock) {
        const clickedBlock = this.cube.blocks.find(
          (block) => block.mesh === raycasterFoundBlock.object
        );
        if (clickedBlock) {
          this.handleBlockClick(clickedBlock);
        }
      }
    }
  }

  handleBlockClick(block) {
    // First check - only proceed if the block is valid for selection
    if (!block.isValid && this.selectedBlocks.length > 0) {
      return;
    }

    // For the first block (starting block)
    if (this.selectedBlocks.length === 0) {
      block.isSelected = true;
      block.updateAppearance();
      this.selectedBlocks.push(block);
      this.removeBlock(block);
      // Show valid moves for next selection
      this.cube.findValidNextMoves(block);
      return;
    }

    // For subsequent blocks
    block.isSelected = true;
    block.updateAppearance();

    const previousBlock = this.selectedBlocks[this.selectedBlocks.length - 1];
    this.selectedBlocks.push(block);

    // Remove block and draw line after blink animation
    this.removeBlock(block, () => {
      this.drawConnectionLine(previousBlock, block);
    });

    // Clear previous valid moves
    this.cube.blocks.forEach((b) => {
      b.isValid = false;
      b.updateAppearance();
    });

    // Show valid moves for next selection
    this.cube.findValidNextMoves(block);
  }

  removeBlock(block, callback) {
    const blinkCount = 3;
    const blinkDuration = 100; // ms per blink
    const shrinkDuration = 500; // ms for shrinking animation

    // Blink animation
    let currentBlink = 0;
    const blinkInterval = setInterval(() => {
      block.mesh.visible = !block.mesh.visible;
      currentBlink++;

      if (currentBlink >= blinkCount * 2) {
        clearInterval(blinkInterval);
        block.mesh.visible = true;

        // Execute callback after blinking (draw line)
        if (callback) callback();

        // Start shrinking animation after blinking
        const startScale = block.mesh.scale.x;
        const targetScale = 0.3;
        const startTime = Date.now();

        const shrinkInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / shrinkDuration, 1);

          // Calculate current scale using linear interpolation
          const currentScale =
            startScale + (targetScale - startScale) * progress;
          block.mesh.scale.set(currentScale, currentScale, currentScale);

          if (progress === 1) {
            clearInterval(shrinkInterval);

            // Final cleanup after shrinking
            const index = this.cube.blocks.indexOf(block);
            if (index > -1) {
              this.cube.blocks.splice(index, 1);
            }
            block.connectedTo = [];
          }
        }, 16); // ~60fps
      }
    }, blinkDuration);
  }

  drawConnectionLine(fromBlock, toBlock) {
    // Create line geometry from the centers of the blocks
    const points = [];
    points.push(fromBlock.mesh.position.clone());
    points.push(toBlock.mesh.position.clone());

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0xff0000,
      linewidth: 5,
    });

    const line = new THREE.Line(geometry, material);
    this.scene.add(line);
    return line;
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
