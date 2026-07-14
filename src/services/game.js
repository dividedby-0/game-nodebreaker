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
  let pendingTraceCallback = null;

  const initialize = async () => {
    gameState.setProcessing(true);
  };

  const initializeUI = async () => {
    await eventBus.emit("score:initialize", gameState.getScore());
    await eventBus.emit("breakers:initialize", gameState.getBreakerCount());
    await eventBus.emit("reset:initialize");
    await eventBus.emit("musicBtn:initialize");
    await eventBus.emit("pauseBtn:initialize");
    await eventBus.emit("leaderboardBtn:initialize");
  };

  const buildModalScoreLines = (score, highScore, isNewHighScore) => {
    const scoreLine = `Final Score: <span style='color: #00ff00; text-shadow: 0 0 5px rgba(0, 255, 0, 0.7), 0 0 10px rgba(0, 255, 0, 0.5)'>${score}</span>`;
    const highScoreLine = isNewHighScore
      ? "<span style='color: #ffff00'>New High Score! :O</span>"
      : `Your highest score: <span style='color: #00ff00; text-shadow: 0 0 5px rgba(0, 255, 0, 0.7), 0 0 10px rgba(0, 255, 0, 0.5)'>${highScore}</span>`;
    return `${scoreLine}<br>${highScoreLine}<br><br>(Tap to dismiss)`;
  };

  const buildRecapTable = () => {
    const normal = gameState.getNormalNodes();
    const breakable = gameState.getBreakableNodes();
    const breaker = gameState.getBreakerNodes();
    const pad = (s, w) => String(s).padStart(w);
    const nc = (c) => `style='color:#${c.toString(16).padStart(6, "0")}'`;
    return `<br><span style='font-family: VT323, monospace; font-size: 0.85em; color: #00ff00; white-space: pre;'>NODES COLLECTED
+---------+------+
| Normal  | <span ${nc(gameConfig.colors.validNode)}>${pad(normal, 4)}</span> |
| Red     | <span ${nc(gameConfig.colors.breakableNode)}>${pad(breakable, 4)}</span> |
| Breaker | <span ${nc(gameConfig.colors.breakerNode)}>${pad(breaker, 4)}</span> |
+---------+------+</span>`;
  };

  // Game-over / win (domain logic — former GameState concern)

  const handleGameOver = (reason) => {
    gameState.setProcessing(true);
    gameState.setTraced(false);
    pendingTraceCallback = null;
    eventBus.emit("trace:visuals:off");

    const score = gameState.getScore();
    const highScore = gameState.getHighScore();
    const isNewHighScore = score > highScore;
    if (isNewHighScore) {
      gameState.setHighScore(score);
    }

    lineManager.stop();
    eventBus.emit("message:hide");
    eventBus.emit("scene:flash");
    const scoreData = {
      score,
      normalNodes: gameState.getNormalNodes(),
      breakableNodes: gameState.getBreakableNodes(),
      breakerNodes: gameState.getBreakerNodes(),
    };
    eventBus.emit("modal:show", {
      message:
        `<span style='color: #ff0000; text-shadow: 0 0 5px rgba(255, 0, 0, 0.7), 0 0 10px rgba(255, 0, 0, 0.5)'>GAME OVER${reason ? `<br><br>${reason}` : ""}</span><br>` +
        buildRecapTable() + "<br><br>" +
        buildModalScoreLines(score, highScore, isNewHighScore),
      enforceDelay: true,
      onDismiss: () => eventBus.emit("leaderboard:prompt", scoreData),
    });

    eventBus.emit("game:over", { reason, score, highScore: isNewHighScore ? score : highScore, isNewHighScore });
    gameState.setComboMultiplier(0);
    gameState.setGameOver(true);
  };

  const handleGameWin = (reason) => {
    gameState.setProcessing(true);
    gameState.setTraced(false);
    pendingTraceCallback = null;
    eventBus.emit("trace:visuals:off");

    const score = gameState.getScore();
    const highScore = gameState.getHighScore();
    const isNewHighScore = score > highScore;
    if (isNewHighScore) {
      gameState.setHighScore(score);
    }

    lineManager.stop();
    eventBus.emit("message:hide");
    eventBus.emit("scene:celebrate");
    const scoreData = {
      score,
      normalNodes: gameState.getNormalNodes(),
      breakableNodes: gameState.getBreakableNodes(),
      breakerNodes: gameState.getBreakerNodes(),
    };
    const lastNode = gameState.getSelectedNodes().at(-1);
    if (lastNode) {
      visualService.emitParticles(lastNode.getMesh().position, renderService.getScene(), {
        color: gameConfig.colors.validNode,
        count: 80,
        spread: 2.0,
        lifetime: 1500,
      });
    }

    eventBus.emit("modal:show", {
      message:
        `<span style='color: #00ff00; text-shadow: 0 0 5px rgba(0, 255, 0, 0.7), 0 0 10px rgba(0, 255, 0, 0.5)'>GOOD JOB!${reason ? `<br><br>${reason}` : ""}</span><br>` +
        buildRecapTable() + "<br><br>" +
        buildModalScoreLines(score, highScore, isNewHighScore),
      enforceDelay: true,
      onDismiss: () => eventBus.emit("leaderboard:prompt", scoreData),
    });

    eventBus.emit("game:win", { reason, score, highScore: isNewHighScore ? score : highScore, isNewHighScore });
    gameState.setComboMultiplier(0);
    gameState.setGameOver(true);
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

  eventBus.on("game:pause", () => {
    if (pendingTraceCallback) {
      lineManager.stop();
    }
    gameState.setPaused(true);
  });

  eventBus.on("game:unpause", () => {
    if (pendingTraceCallback) {
      lineManager.startTrace(pendingTraceCallback);
    }
    gameState.setPaused(false);
  });

  eventBus.on("game:reset", () => {
    pendingTraceCallback = null;
    eventBus.emit("trace:visuals:off");
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
    if (gameState.isProcessing() || gameState.isGameOver()) { return; }

    if (!isValidMove(clickedNode)) {
      visualService.flashNodeInvalid(clickedNode);
      audioService.playInvalidSound();
      return;
    }

    gameState.setProcessing(true);

    const hiddenNodes = gameState.getHiddenNodes();
    hiddenNodes.forEach((node) => {
      visualService.unhideObstructingNodes(node);
    });
    gameState.clearHiddenNodes();

    const previousNode =
      gameState.getSelectedNodes()[gameState.getSelectedNodes().length - 1];

    const nodePosition = clickedNode.getMesh().position;
    let traceCallback = null;
    if (clickedNode.isBreakable()) {
      if (gameState.getBreakerCount() <= 0) {
        gameState.setProcessing(false);
        return;
      }
      clickedNode.setValid(true);
      const wasBeingTraced = gameState.isBeingTraced();
      handleBreakableNode(nodePosition);
      if (!wasBeingTraced) {
        traceCallback = () => handleGameOver("You have been traced :/");
      }
    } else if (clickedNode.isBreaker()) {
      handleBreakerNode(nodePosition);
    } else {
      handleNormalNode(nodePosition);
    }

    renderService.focusCamOnNode(clickedNode);
    gameState.addSelectedNode(clickedNode);
    updateGameState(clickedNode, previousNode, traceCallback);
  };

  // Node click handlers

  const emitScorePopup = (position, value, color) => {
    eventBus.emit("score:popup", { position: position.clone(), value, color });
  };

  const handleNormalNode = (position) => {
    gameState.setComboMultiplier(0);
    gameState.setScore(
      gameState.getScore() + gameConfig.game.scoreIncrement.normal,
    );
    gameState.setNormalNodes(gameState.getNormalNodes() + 1);
    audioService.playSoundEffect("normalNode");
    emitScorePopup(position, gameConfig.game.scoreIncrement.normal, "87cefa");
  };

  const handleBreakableNode = (position) => {
    const combo = gameState.getComboMultiplier() + 1;
    gameState.setComboMultiplier(combo);
    gameState.setBreakerCount(gameState.getBreakerCount() - 1);
    gameState.setScore(
      gameState.getScore() + gameConfig.game.scoreIncrement.breakable * combo,
    );
    gameState.setBreakableNodes(gameState.getBreakableNodes() + 1);
    audioService.playSoundEffect("dataNode");

    if (!gameState.isBeingTraced()) {
      audioService.playSoundEffect("traced");
      gameState.setTraced(true);
      eventBus.emit("scene:flash");
      renderService.triggerGlitchEffect();
      eventBus.emit("message:show", "RUN. YOU'RE BEING TRACED.");
      eventBus.emit("trace:visuals:on");
    }
    emitScorePopup(position, gameConfig.game.scoreIncrement.breakable * combo, "ff4500");
  };

  const handleBreakerNode = (position) => {
    gameState.setComboMultiplier(0);
    gameState.setBreakerCount(gameState.getBreakerCount() + 1);
    gameState.setScore(
      gameState.getScore() + gameConfig.game.scoreIncrement.breaker,
    );
    gameState.setBreakerNodes(gameState.getBreakerNodes() + 1);
    audioService.playSoundEffect("breakerNode");
    emitScorePopup(position, gameConfig.game.scoreIncrement.breaker, "7799cc");
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

  const updateGameState = (clickedNode, previousNode, onTraceComplete = null) => {
    clickedNode.setSelected(true);
    clickedNode.setVisited(true);

    if (previousNode) {
      lineManager.drawConnectionLine(
        renderService.getScene(),
        previousNode,
        clickedNode,
      );
    }

    const result = nodeNetwork.findValidNextMoves(clickedNode, gameState.getBreakerCount());
    if (result.completed) {
      if (result.notAllVisited) {
        handleGameOver("You got stuck ¯\\_(ツ)_/¯");
      } else {
        handleGameWin("You linked all the nodes!");
      }
      visualService.animateNodeRemoval(clickedNode, () => {});
    } else {
      if (onTraceComplete) {
        pendingTraceCallback = onTraceComplete;
        lineManager.startTrace(onTraceComplete);
      }
      visualService.animateNodeRemoval(clickedNode, () => {
        gameState.setProcessing(false);
      });
    }
  };

  return {
    initialize,
    initializeUI,
  };
};
