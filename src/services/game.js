export const GameService = (
  renderService,
  nodeNetwork,
  eventBus,
  gameState,
  gameConfig,
  visualService,
  lineManager,
  audioService,
) => {
  const initialize = async () => {
    gameState.setProcessing(true);
    eventBus.emit("game:initialized");
  };

  const initializeUI = async () => {
    await eventBus.emit("score:initialize", gameState.getScore());
    await eventBus.emit("breakers:initialize", gameState.getBreakerCount());
    await eventBus.emit("reset:initialize");
    await eventBus.emit("musicBtn:initialize");
  };

  // Event listeners

  eventBus.on("game:over", () => {
    lineManager.stop();
  });

  eventBus.on("game:win", () => {
    lineManager.stop();
  });

  eventBus.on("camera:focused", ({ node, camera, scene }) => {
    visualService.checkVisualObstructions(
      camera,
      node,
      nodeNetwork.getNodesArray(),
      scene,
      (hiddenNode) => gameState.addHiddenNode(hiddenNode),
    );
  });

  eventBus.on("input:click", ({ raycaster }) => {
    if (gameState.isProcessing()) {
      return;
    }
    const intersectedMeshes = raycaster.intersectObjects(
      nodeNetwork.getNodesArray().map((node) => node.getMesh()),
    );

    if (intersectedMeshes.length > 0) {
      const raycasterFoundNode = intersectedMeshes.find(
        (mesh) => mesh.face !== null,
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

    if (isValidMove(clickedNode)) {
      const hiddenNodes = gameState.getHiddenNodes();
      hiddenNodes.forEach((node) => {
        visualService.unhideObstructingNodes(node);
      });
      gameState.clearHiddenNodes();
    }

    const previousNode =
      gameState.getSelectedNodes()[gameState.getSelectedNodes().length - 1];

    if (clickedNode.isBreakable()) {
      if (gameState.getBreakerCount() <= 0) {
        gameState.setProcessing(false);
        return;
      }
      clickedNode.setValid(true);
      handleBreakableNode(clickedNode, previousNode);
    } else if (clickedNode.isBreaker()) {
      handleBreakerNode(clickedNode, previousNode);
    } else {
      handleNormalNode(clickedNode, previousNode);
    }

    renderService.focusCamOnNode(clickedNode);
    gameState.getSelectedNodes().push(clickedNode);
    updateGameState(clickedNode, previousNode);
  };

  // Node click handlers

  const handleNormalNode = (clickedNode, previousNode) => {
    gameState.setScore(
      gameState.getScore() + gameConfig.game.scoreIncrement.normal,
    );
    eventBus.emit("score:update", gameState.getScore());
    audioService.playSoundEffect("normalNode");
  };

  const handleBreakableNode = (clickedNode, previousNode) => {
    gameState.setBreakerCount(gameState.getBreakerCount() - 1);
    gameState.setScore(
      gameState.getScore() + gameConfig.game.scoreIncrement.breakable,
    );
    eventBus.emit("score:update", gameState.getScore());
    eventBus.emit("breakers:update", gameState.getBreakerCount());
    audioService.playSoundEffect("dataNode");

    if (!gameState.isBeingTraced()) {
      audioService.playSoundEffect("traced");
      gameState.setTraced(true);
      eventBus.emit("scene:flash");
      renderService.triggerGlitchEffect();
      eventBus.emit("message:show", "YOU'RE BEING TRACED");
      lineManager.startTrace(() => {
        gameState.setProcessing(true);
        gameState.showGameOver("You have been traced :/");
      });
    }
  };

  const handleBreakerNode = (clickedNode, previousNode) => {
    gameState.setBreakerCount(gameState.getBreakerCount() + 1);
    gameState.setScore(
      gameState.getScore() + gameConfig.game.scoreIncrement.breaker,
    );
    eventBus.emit("score:update", gameState.getScore());
    eventBus.emit("breakers:update", gameState.getBreakerCount());
    audioService.playSoundEffect("breakerNode");
  };

  // Auxiliary methods

  const isValidMove = (clickedNode) => {
    if (
      gameState.getSelectedNodes().length === 0 &&
      clickedNode.isBreakable() &&
      gameState.getBreakerCount() <= 0
    ) {
      return false;
    }

    return gameState.getSelectedNodes().length === 0 || clickedNode.isValid();
  };

  const updateGameState = (clickedNode, previousNode) => {
    clickedNode.setSelected(true);
    clickedNode.setVisited(true);

    if (previousNode) {
      lineManager.drawConnectionLine(
        renderService.getScene(),
        previousNode,
        clickedNode,
      );
    }

    gameState.getSelectedNodes().push(clickedNode);
    nodeNetwork.findValidNextMoves(clickedNode);
    visualService.animateNodeRemoval(clickedNode, () => {
      gameState.setProcessing(false);
    });
  };

  return {
    initialize,
    initializeUI,
    handleNodeClick,
    getNodeNetwork: () => nodeNetwork,
    getGameState: () => ({ ...gameState }),
    on: eventBus.on,
    off: eventBus.off,
  };
};
