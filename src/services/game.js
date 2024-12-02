export const GameService = (
  renderService,
  nodeNetwork,
  eventBus,
  gameState,
  gameConfig,
  physicsService
) => {
  const initialize = async () => {
    eventBus.emit("game:initialized");
    await eventBus.emit("score:initialize", gameState.getScore());
    await eventBus.emit("timer:initialize", gameState.getTimeElapsed());
    await eventBus.emit("breakers:initialize", gameState.getBreakerCount());
  };

  // Event listeners

  eventBus.on("input:click", ({ raycaster }) => {
    if (gameState.isProcessing()) {
      return;
    }
    const intersectedMeshes = raycaster.intersectObjects(
      nodeNetwork.getNodesArray().map((node) => node.getMesh())
    );

    if (intersectedMeshes.length > 0) {
      const raycasterFoundNode = intersectedMeshes.find(
        (mesh) => mesh.face !== null
      );
      if (raycasterFoundNode) {
        const clickedNode = nodeNetwork
          .getNodesArray()
          .find((node) => node.getMesh() === raycasterFoundNode.object);
        if (clickedNode) {
          handleNodeClick(clickedNode);
        }
      }
    }
  });

  // Event methods

  const handleNodeClick = (clickedNode) => {
    if (gameState.isProcessing() || !isValidMove(clickedNode)) {
      return;
    }

    gameState.setProcessing(true);

    // Clear any previously hidden nodes before handling the new selection
    const hiddenNodes = gameState.getHiddenNodes();
    hiddenNodes.forEach((node) => {
      const nodeMesh = node.getMesh();
      // Setup fade-in animation parameters
      const fadeInDuration = 500;
      const startFadeInTime = Date.now();
      const startOpacity = 0;
      const targetOpacity = 1;

      nodeMesh.material.transparent = true;
      nodeMesh.layers.enable(0);
      if (nodeMesh.children[0]) {
        nodeMesh.children[0].visible = true;
      }

      const fadeInAnimation = () => {
        const elapsed = Date.now() - startFadeInTime;
        const progress = Math.min(elapsed / fadeInDuration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        const newOpacity =
          startOpacity + (targetOpacity - startOpacity) * easeProgress;
        nodeMesh.material.opacity = newOpacity;
        if (nodeMesh.children[0]) {
          nodeMesh.children[0].material.opacity = newOpacity;
          nodeMesh.children[0].material.transparent = true;
        }

        if (progress < 1) {
          requestAnimationFrame(fadeInAnimation);
        } else {
          nodeMesh.material.transparent = false;
        }
      };
      fadeInAnimation();
    });

    gameState.clearHiddenNodes();
    gameState.setProcessing(false);

    if (clickedNode.isBreakable()) {
      if (gameState.getBreakerCount() <= 0) {
        return;
      }
      clickedNode.setValid(true);
      handleBreakableNode(clickedNode);
    }

    if (clickedNode.isBreaker()) {
      handleBreakerNode(clickedNode);
    } else {
      handleNormalNode(clickedNode);
    }
    const previousNode =
      gameState.getSelectedNodes()[gameState.getSelectedNodes().length - 1];

    updategameState(clickedNode, previousNode);
    renderService.focusCamOnNode(clickedNode);

    gameState.getSelectedNodes().push(clickedNode);
    nodeNetwork.findValidNextMoves(clickedNode);
  };

  // Node click handlers

  const handleNormalNode = (clickedNode) => {
    gameState.setScore(
      gameState.getScore() + gameConfig.game.scoreIncrement.normal
    );
    eventBus.emit("score:update", gameState.getScore());
  };

  const handleBreakableNode = (clickedNode) => {
    gameState.setBreakerCount(gameState.getBreakerCount() - 1);
    gameState.setScore(
      gameState.getScore() + gameConfig.game.scoreIncrement.breakable
    );
    eventBus.emit("score:update", gameState.getScore());
    eventBus.emit("breakers:update", gameState.getBreakerCount());
  };

  const handleBreakerNode = (clickedNode) => {
    gameState.setBreakerCount(gameState.getBreakerCount() + 1);
    gameState.setScore(
      gameState.getScore() + gameConfig.game.scoreIncrement.breaker
    );
    eventBus.emit("score:update", gameState.getScore());
    eventBus.emit("breakers:update", gameState.getBreakerCount());
  };

  // Auxiliary methods

  const isValidMove = (clickedNode) =>
    gameState.getSelectedNodes().length === 0 || clickedNode.isValid();

  const updategameState = (clickedNode, previousNode) => {
    clickedNode.setSelected(true);
    gameState.getSelectedNodes().push(clickedNode);
    nodeNetwork.findValidNextMoves(clickedNode);
    physicsService.animateNodeRemoval(clickedNode);

    if (gameState.getSelectedNodes().length === 1) {
      gameState.startTimer();
      return;
    }

    physicsService.drawConnectionLine(
      renderService.getScene(),
      clickedNode,
      previousNode
    );
  };

  return {
    initialize,
    handleNodeClick,
    getNodeNetwork: () => nodeNetwork,
    getGameState: () => ({ ...gameState }),
    on: eventBus.on,
    off: eventBus.off,
  };
};
