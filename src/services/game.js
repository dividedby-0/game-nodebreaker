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
  let bonusSpawnTimer = null;
  let hasTriggeredFirstBonus = false;
  let timerInterval = null;

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
    const highScoreLine = isNewHighScore
      ? "<span style='color: #ffff00'>New High Score! :O</span>"
      : `Your highest score: <span style='color: #00ff00; text-shadow: 0 0 5px rgba(0, 255, 0, 0.7), 0 0 10px rgba(0, 255, 0, 0.5)'>${highScore}</span>`;
    return `${highScoreLine}<br><br>(Tap to dismiss)`;
  };

  const buildRecapTable = (elapsedMs = null, timeBonus = null) => {
    const normal = gameState.getNormalNodes();
    const breakable = gameState.getBreakableNodes();
    const breaker = gameState.getBreakerNodes();
    const bonus = gameState.getBonusNodes();
    const normalScore = gameState.getNormalScore();
    const breakableScore = gameState.getBreakableScore();
    const breakerScore = gameState.getBreakerScore();
    const bonusScore = gameState.getBonusScore();
    const pad = (s, w) => String(s).padStart(w);
    const pp = (v) => pad("+" + v, 6);
    let timeRow = "";
    if (elapsedMs !== null) {
      const totalSec = Math.floor(elapsedMs / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      const timeStr = `${min}:${String(sec).padStart(2, "0")}`;
      const timePts = timeBonus !== null ? pp(timeBonus) : "      ";
      timeRow = `| Time    | ${pad(timeStr, 5)} | ${timePts} |\n`;
    }
    const total = gameState.getScore();
    return `<br><span style='font-family: VT323, monospace; font-size: 0.85em; color: #00ff00; white-space: pre;'>NODES COLLECTED
+---------+-------+--------+
| Type    | Qty   | Points |
+---------+-------+--------+
| Normal  | ${pad(normal, 5)} | ${pp(normalScore)} |
| Red     | ${pad(breakable, 5)} | ${pp(breakableScore)} |
| Breaker | ${pad(breaker, 5)} | ${pp(breakerScore)} |
| Golden  | ${pad(bonus, 5)} | ${pp(bonusScore)} |
${timeRow}+---------+-------+--------+
| Total   |       | ${pad(total, 6)} |
+---------+-------+--------+</span>`;
  };

  // Bonus node helpers

  const clearBonusState = () => {
    if (bonusSpawnTimer) {
      clearTimeout(bonusSpawnTimer);
      bonusSpawnTimer = null;
    }
    const current = gameState.getBonusNode();
    if (current) {
      current.setBonus(false);
      gameState.setBonusNode(null);
    }
  };

  const spawnBonusNode = () => {
    clearBonusState();
    const candidate = nodeNetwork.getRandomUnvisitedNormalNode();
    if (!candidate) { return; }
    candidate.setBonus(true);
    visualService.emitBonusSpawnEffect(candidate.getMesh().position, renderService.getScene());
    gameState.setBonusNode(candidate);
  };

  const scheduleBonusSpawn = (delay) => {
    clearBonusState();
    bonusSpawnTimer = setTimeout(spawnBonusNode, delay);
  };

  // Game-over / win (domain logic — former GameState concern)

  const handleGameOver = (reason) => {
    gameState.setProcessing(true);
    gameState.setTraced(false);
    pendingTraceCallback = null;
    clearBonusState();
    eventBus.emit("trace:visuals:off");

    clearInterval(timerInterval);
    timerInterval = null;
    gameState.setTimerRunning(false);
    const elapsed = gameState.getElapsedTime();
    const elapsedSec = elapsed / 1000;
    const maxTime = gameConfig.game.timer.maxTime;
    const mult = Math.max(0, Math.sqrt((maxTime - elapsedSec) / maxTime));
    const timeBonus = Math.floor(gameState.getScore() * mult);
    gameState.setScore(gameState.getScore() + timeBonus);

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
      time: elapsedSec,
      normalNodes: gameState.getNormalNodes(),
      breakableNodes: gameState.getBreakableNodes(),
      breakerNodes: gameState.getBreakerNodes(),
    };
    eventBus.emit("modal:show", {
      message:
        `<span style='color: #ff0000; text-shadow: 0 0 5px rgba(255, 0, 0, 0.7), 0 0 10px rgba(255, 0, 0, 0.5)'>GAME OVER${reason ? `<br><br>${reason}` : ""}</span><br>` +
        buildRecapTable(elapsed, timeBonus) + "<br><br>" +
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
    clearBonusState();
    eventBus.emit("trace:visuals:off");

    clearInterval(timerInterval);
    timerInterval = null;
    gameState.setTimerRunning(false);
    const elapsed = gameState.getElapsedTime();
    const elapsedSec = elapsed / 1000;
    const maxTime = gameConfig.game.timer.maxTime;
    const mult = Math.max(0, Math.sqrt((maxTime - elapsedSec) / maxTime));
    const timeBonus = Math.floor(gameState.getScore() * mult);
    gameState.setScore(gameState.getScore() + timeBonus);

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
      time: elapsedSec,
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
        buildRecapTable(elapsed, timeBonus) + "<br><br>" +
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
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    gameState.setPaused(true);
  });

  eventBus.on("game:unpause", () => {
    if (pendingTraceCallback) {
      lineManager.startTrace(pendingTraceCallback);
    }
    if (gameState.isTimerRunning() && !timerInterval) {
      const timerIntervalMs = gameConfig.game.timer.displayInterval;
      timerInterval = setInterval(() => {
        const elapsed = gameState.getElapsedTime() + timerIntervalMs;
        gameState.setElapsedTime(elapsed);
        eventBus.emit("timer:update", elapsed);
      }, timerIntervalMs);
    }
    gameState.setPaused(false);
  });

  eventBus.on("game:reset", () => {
    pendingTraceCallback = null;
    clearBonusState();
    hasTriggeredFirstBonus = false;
    clearInterval(timerInterval);
    timerInterval = null;
    gameState.setTimerRunning(false);
    eventBus.emit("trace:visuals:off");
  });

  eventBus.on("game:start", () => {
    if (hasTriggeredFirstBonus) { return; }
    hasTriggeredFirstBonus = true;
    const { bonusInitialMinDelay, bonusInitialMaxDelay } = gameConfig.game.timing;
    const delay = bonusInitialMinDelay + Math.random() * (bonusInitialMaxDelay - bonusInitialMinDelay);
    scheduleBonusSpawn(delay);
    const timerIntervalMs = gameConfig.game.timer.displayInterval;
    timerInterval = setInterval(() => {
      const elapsed = gameState.getElapsedTime() + timerIntervalMs;
      gameState.setElapsedTime(elapsed);
      eventBus.emit("timer:update", elapsed);
    }, timerIntervalMs);
    gameState.setTimerRunning(true);
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

    let isBonusClick = false;
    if (clickedNode.isBonus()) {
      isBonusClick = true;
      // Don't clear yet — keep isBonus true for isValidMove
    }

    if (!isValidMove(clickedNode)) {
      visualService.flashNodeInvalid(clickedNode);
      audioService.playInvalidSound();
      return;
    }

    gameState.setProcessing(true);

    if (isBonusClick) {
      clearBonusState();
    }

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

    if (isBonusClick) {
      gameState.setBonusNodes(gameState.getBonusNodes() + 1);
      const bonusScore = gameConfig.game.scoreIncrement.bonus;
      gameState.setScore(gameState.getScore() + bonusScore);
      gameState.setBonusScore(gameState.getBonusScore() + bonusScore);
      audioService.playBonusSound();
      emitScorePopup(nodePosition, bonusScore, "ffd700");
      const { bonusRespawnMinDelay, bonusRespawnMaxDelay } = gameConfig.game.timing;
      const delay = bonusRespawnMinDelay + Math.random() * (bonusRespawnMaxDelay - bonusRespawnMinDelay);
      scheduleBonusSpawn(delay);
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
    const pts = gameConfig.game.scoreIncrement.normal;
    gameState.setScore(gameState.getScore() + pts);
    gameState.setNormalScore(gameState.getNormalScore() + pts);
    gameState.setNormalNodes(gameState.getNormalNodes() + 1);
    audioService.playSoundEffect("normalNode");
    emitScorePopup(position, pts, "87cefa");
  };

  const handleBreakableNode = (position) => {
    const combo = gameState.getComboMultiplier() + 1;
    gameState.setComboMultiplier(combo);
    gameState.setBreakerCount(gameState.getBreakerCount() - 1);
    const pts = gameConfig.game.scoreIncrement.breakable * combo;
    gameState.setScore(gameState.getScore() + pts);
    gameState.setBreakableScore(gameState.getBreakableScore() + pts);
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
    const pts = gameConfig.game.scoreIncrement.breaker;
    gameState.setScore(gameState.getScore() + pts);
    gameState.setBreakerScore(gameState.getBreakerScore() + pts);
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
