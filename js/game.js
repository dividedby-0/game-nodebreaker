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
    this.isProcessing = true;
    this.scoreElement = new TerminalText("score", {});
    this.timerElement = new TerminalText("timer", {});
    this.breakersElement = new TerminalText("breakers", {});
    this.timerStarted = false;
    this.timerInterval = null;
    this.timeElapsed = 0;
    this.breakerCount = 0;
  }

  async initializeUI() {
    await this.scoreElement.typeText(
      "Score: 0",
      document.getElementById("score")
    );
    await this.timerElement.typeText(
      "Time: 0s",
      document.getElementById("timer")
    );
    await this.breakersElement.typeText(
      "Breakers: 0",
      document.getElementById("breakers")
    );
    await this.showMessage("go", 400);
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
        this.isProcessing = false;
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

  centerCameraOnBlock(block) {
    this.isProcessing = true;
    const cubeCenter = new THREE.Vector3(0, 0, 0);
    const previousCamFocusPoint = this.controls.target.clone();
    const newCamFocusPoint = block.mesh.position.clone();

    const startCameraPos = this.camera.position.clone();
    const currentOffset = startCameraPos.clone().sub(previousCamFocusPoint);

    const direction = newCamFocusPoint.clone().sub(cubeCenter);
    direction.normalize();

    const distance = currentOffset.length();

    // Calculate both horizontal and vertical angles
    const azimuthalAngle = Math.atan2(direction.z, direction.x);
    const polarAngle = Math.acos(direction.y);

    // Calculate appropriate rotation based on direction vector
    const rotatedOffset = currentOffset.clone();

    // Apply azimuthal rotation (x-z plane)
    rotatedOffset.x =
      currentOffset.x * Math.cos(azimuthalAngle) -
      currentOffset.z * Math.sin(azimuthalAngle);
    rotatedOffset.z =
      currentOffset.x * Math.sin(azimuthalAngle) +
      currentOffset.z * Math.cos(azimuthalAngle);

    // Apply polar rotation (vertical)
    const y = rotatedOffset.y;
    rotatedOffset.y =
      y * Math.cos(polarAngle) - rotatedOffset.z * Math.sin(polarAngle);
    rotatedOffset.z =
      y * Math.sin(polarAngle) + rotatedOffset.z * Math.cos(polarAngle);

    const endCameraPos = newCamFocusPoint
      .clone()
      .add(direction.multiplyScalar(distance));

    const duration = 1000;
    const startTime = Date.now();

    this.controls.enabled = false;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const newCameraPos = new THREE.Vector3().lerpVectors(
        startCameraPos,
        endCameraPos,
        easeProgress
      );

      const newTarget = new THREE.Vector3().lerpVectors(
        previousCamFocusPoint,
        block.mesh.position,
        easeProgress
      );

      this.camera.position.copy(newCameraPos);
      this.controls.target.copy(newTarget);
      this.controls.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isProcessing = false;
        this.controls.enabled = true;
      }
    };

    animate();
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
    if (block.isBreakable) {
      if (this.breakerCount > 0) {
        this.centerCameraOnBlock(block);
        this.breakerCount--;
        document.querySelector(
          ".breakers-terminal-text"
        ).textContent = `Breakers: ${this.breakerCount}`;
        block.isValid = true;
        block.updateAppearance();

        this.score += 10; // Points for breakable block
        document.querySelector(
          ".score-terminal-text"
        ).textContent = `Score: ${this.score}`;

        const previousBlock =
          this.selectedBlocks[this.selectedBlocks.length - 1];
        this.selectedBlocks.push(block);
        this.cube.findValidNextMoves(block);
        this.removeBlock(block, () => {
          this.drawConnectionLine(previousBlock, block);
        });
        return;
      } else {
        return; // Exit if no breakers available
      }
    }

    // First check - only proceed if the block is valid for selection
    if (!block.isValid && this.selectedBlocks.length > 0) {
      return;
    }

    if (block.isBreaker) {
      this.centerCameraOnBlock(block);
      this.breakerCount++;
      this.score += 5; // Points for breaker block
      document.querySelector(
        ".score-terminal-text"
      ).textContent = `Score: ${this.score}`;
      document.querySelector(
        ".breakers-terminal-text"
      ).textContent = `Breakers: ${this.breakerCount}`;
    } else {
      this.centerCameraOnBlock(block);
      this.score += 5; // Points for normal block
      document.querySelector(
        ".score-terminal-text"
      ).textContent = `Score: ${this.score}`;
    }

    // For the first block (starting block)
    if (this.selectedBlocks.length === 0) {
      this.startTimer();
      block.isSelected = true;
      block.updateAppearance();
      this.selectedBlocks.push(block);
      this.cube.findValidNextMoves(block);
      this.removeBlock(block);
      return;
    }

    // For subsequent blocks
    block.isSelected = true;
    block.updateAppearance();

    const previousBlock = this.selectedBlocks[this.selectedBlocks.length - 1];
    this.selectedBlocks.push(block);

    // Show valid moves for next selection
    this.cube.findValidNextMoves(block);

    // Remove block and draw line after blink animation
    this.removeBlock(block, () => {
      this.drawConnectionLine(previousBlock, block);
    });
  }

  startTimer() {
    if (!this.timerStarted) {
      this.timerStarted = true;
      this.startTime = Date.now();
      this.timerInterval = setInterval(() => {
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.startTime;
        const seconds = Math.floor(elapsedTime / 1000);
        const milliseconds = Math.floor((elapsedTime % 1000) / 10); // Get 2 digits of milliseconds

        // Format to ensure 2 digits for milliseconds
        const formattedMilliseconds = milliseconds.toString().padStart(2, "0");

        document.querySelector(
          ".timer-terminal-text"
        ).textContent = `Time: ${seconds}.${formattedMilliseconds}s`;
      }, 10); // Update more frequently to show smooth milliseconds
    }
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
          }
        }, 16); // ~60fps
      }
    }, blinkDuration);

    const index = this.cube.blocks.indexOf(block);
    if (index > -1) {
      // Clear connections before removal
      block.connections.forEach((connectedBlock) => {
        connectedBlock.removeConnection(block);
      });
      block.clearConnections();
      this.cube.blocks.splice(index, 1);
    }
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

  async showMessage(messageText, duration = 2000) {
    const messageElement = document.getElementById("message");
    const terminalText = new TerminalText("message", {
      textColor: "#00ff00",
      caretColor: "#00ff00",
    });

    messageElement.addEventListener("click", () => {
      messageElement.style.opacity = "0";
      setTimeout(() => {
        messageElement.innerHTML = "";
      }, 500);
    });

    // Show container
    messageElement.style.opacity = "1";

    // Type the message
    await terminalText.typeText(messageText, messageElement);

    // Wait for duration
    await new Promise((resolve) => setTimeout(resolve, duration));

    // Fade out if not already hidden by click
    if (messageElement.style.opacity !== "0") {
      messageElement.style.opacity = "0";
      setTimeout(() => {
        messageElement.innerHTML = "";
      }, 500);
    }
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

  // Three.js scene render cycle
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
