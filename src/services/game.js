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

    if (clickedNode.isBreakable()) {
      if (gameState.getBreakerCount() <= 0) {
        return;
      }
      clickedNode.setValid(true);
      handleBreakableNode(clickedNode);
      // return;
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
    shrinkNode(clickedNode);

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

  // Animations

  const shrinkNode = (node, callback) => {
    gameState.setProcessing(true);
    const blinkCount = 3;
    const blinkDuration = 100; // ms
    const shrinkDuration = 500; // ms

    let currentBlink = 0;
    const blinkInterval = setInterval(() => {
      node.getMesh().visible = !node.getMesh().visible;
      currentBlink++;

      if (currentBlink >= blinkCount * 2) {
        clearInterval(blinkInterval);
        node.getMesh().visible = true;

        // Start shrinking animation
        const startScale = node.getMesh().scale.x;
        const targetScale = 0.3;
        const startTime = Date.now();

        const shrinkInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / shrinkDuration, 1);

          // Ease out cubic
          const easeProgress = 1 - Math.pow(1 - progress, 3);

          // Calculate current scale using linear interpolation
          const currentScale =
            startScale + (targetScale - startScale) * easeProgress;
          node.getMesh().scale.set(currentScale, currentScale, currentScale);

          if (progress === 1) {
            clearInterval(shrinkInterval);

            // Final cleanup
            const index = nodeNetwork.getNodesArray().indexOf(node);
            if (index > -1) {
              nodeNetwork.removeNode(node);
            }
            gameState.setProcessing(false);
          }
        }, 16); // ~60fps
      }
    }, blinkDuration);
  };

  return {
    initialize,
    handleNodeClick,
    shrinkNode,
    getNodeNetwork: () => nodeNetwork,
    getGameState: () => ({ ...gameState }),
    on: eventBus.on,
    off: eventBus.off,
  };
};
