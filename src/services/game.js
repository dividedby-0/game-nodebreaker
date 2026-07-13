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
  };

  const initializeUI = async () => {
    await eventBus.emit("score:initialize", gameState.getScore());
    await eventBus.emit("breakers:initialize", gameState.getBreakerCount());
    await eventBus.emit("reset:initialize");
    await eventBus.emit("musicBtn:initialize");
  };

  const buildModalScoreLines = (score, highScore, isNewHighScore) => {
    const scoreLine = `Final Score: <span style='color: #00ff00; text-shadow: 0 0 5px rgba(0, 255, 0, 0.7), 0 0 10px rgba(0, 255, 0, 0.5)'>${score}</span>`;
    const highScoreLine = isNewHighScore
      ? "<span style='color: #ffff00'>New High Score! :O</span>"
      : `Your highest score: <span style='color: #00ff00; text-shadow: 0 0 5px rgba(0, 255, 0, 0.7), 0 0 10px rgba(0, 255, 0, 0.5)'>${highScore}</span>`;
    return `${scoreLine}<br>${highScoreLine}<br><br>(Tap to dismiss)`;
  };

  // Game-over / win (domain logic — former GameState concern)

  const handleGameOver = (reason) => {
    gameState.setProcessing(true);
    gameState.setTraced(false);

    const score = gameState.getScore();
    const highScore = gameState.getHighScore();
    const isNewHighScore = score > highScore;
    if (isNewHighScore) {
      gameState.setHighScore(score);
    }

    lineManager.stop();
    eventBus.emit("message:hide");
    eventBus.emit("scene:flash");
    eventBus.emit("modal:show", {
      message:
        `<span style='color: #ff0000; text-shadow: 0 0 5px rgba(255, 0, 0, 0.7), 0 0 10px rgba(255, 0, 0, 0.5)'>GAME OVER${reason ? `<br><br>${reason}` : ""}</span><br><br>` +
        buildModalScoreLines(score, highScore, isNewHighScore),
      enforceDelay: true,
    });

    eventBus.emit("game:over", { reason, score, highScore: isNewHighScore ? score : highScore, isNewHighScore });
  };

  const handleGameWin = (reason) => {
    gameState.setProcessing(true);
    gameState.setTraced(false);

    const score = gameState.getScore();
    const highScore = gameState.getHighScore();
    const isNewHighScore = score > highScore;
    if (isNewHighScore) {
      gameState.setHighScore(score);
    }

    lineManager.stop();
    eventBus.emit("message:hide");
    eventBus.emit("scene:flash");
    eventBus.emit("modal:show", {
      message:
        `<span style='color: #00ff00; text-shadow: 0 0 5px rgba(0, 255, 0, 0.7), 0 0 10px rgba(0, 255, 0, 0.5)'>GOOD JOB!${reason ? `<br><br>${reason}` : ""}</span><br><br>` +
        buildModalScoreLines(score, highScore, isNewHighScore),
      enforceDelay: true,
    });

    eventBus.emit("game:win", { reason, score, highScore: isNewHighScore ? score : highScore, isNewHighScore });
  };

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
      handleBreakableNode();
    } else if (clickedNode.isBreaker()) {
      handleBreakerNode();
    } else {
      handleNormalNode();
    }

    renderService.focusCamOnNode(clickedNode);
    gameState.addSelectedNode(clickedNode);
    updateGameState(clickedNode, previousNode);
  };

  // Node click handlers

  const handleNormalNode = () => {
    gameState.setScore(
      gameState.getScore() + gameConfig.game.scoreIncrement.normal,
    );
    audioService.playSoundEffect("normalNode");
  };

  const handleBreakableNode = () => {
    gameState.setBreakerCount(gameState.getBreakerCount() - 1);
    gameState.setScore(
      gameState.getScore() + gameConfig.game.scoreIncrement.breakable,
    );
    audioService.playSoundEffect("dataNode");

    if (!gameState.isBeingTraced()) {
      audioService.playSoundEffect("traced");
      gameState.setTraced(true);
      eventBus.emit("scene:flash");
      renderService.triggerGlitchEffect();
      eventBus.emit("message:show", "YOU'RE BEING TRACED");
      lineManager.startTrace(() => {
        handleGameOver("You have been traced :/");
      });
    }
  };

  const handleBreakerNode = () => {
    gameState.setBreakerCount(gameState.getBreakerCount() + 1);
    gameState.setScore(
      gameState.getScore() + gameConfig.game.scoreIncrement.breaker,
    );
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

    const result = nodeNetwork.findValidNextMoves(clickedNode);
    if (result.completed) {
      if (result.notAllVisited) {
        handleGameOver("You got stuck ¯\\_(ツ)_/¯");
      } else {
        handleGameWin("You linked all the nodes!");
      }
      visualService.animateNodeRemoval(clickedNode, () => {});
    } else {
      visualService.animateNodeRemoval(clickedNode, () => {
        gameState.setProcessing(false);
      });
    }
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
