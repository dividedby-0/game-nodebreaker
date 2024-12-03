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

    // Clear any previously hidden nodes
    const hiddenNodes = gameState.getHiddenNodes();
    hiddenNodes.forEach((node) => {
      physicsService.unhideObstructingNodes(node);
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
