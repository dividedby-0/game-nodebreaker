export const GameState = (eventBus) => {
  const state = {
    score: 0,
    highScore: parseInt(localStorage.getItem("nodebreaker_highscore")) || 0,
    selectedNodes: [],
    breakerCount: 0,
    isProcessing: false,
    hiddenNodes: new Set(),
    isBeingTraced: false,
    gameAlreadyInitialized: false,
    isGameCompleted: false,
    areValidNodesLeft: false,
    isSoundEnabled: true,
  };

  return {
    // State getters
    getScore: () => state.score,
    getSelectedNodes: () => state.selectedNodes,
    getBreakerCount: () => state.breakerCount,
    getHiddenNodes: () => state.hiddenNodes,
    isProcessing: () => state.isProcessing,
    isBeingTraced: () => state.isBeingTraced,
    getGameAlreadyInitialized: () => state.gameAlreadyInitialized,
    isGameCompleted: () => state.isGameCompleted,
    areValidNodesLeft: () => state.areValidNodesLeft,
    isSoundEnabled: () => state.isSoundEnabled,

    // State setters
    setGameAlreadyInitialized: () => {
      state.gameAlreadyInitialized = true;
    },
    setGameCompleted: (completed) => {
      state.isGameCompleted = completed;
    },
    setValidNodesLeft: (areValidNodesLeft) => {
      state.areValidNodesLeft = areValidNodesLeft;
    },
    setScore: (score) => {
      state.score = score;
      eventBus.emit("score:update", score);
    },
    addSelectedNode: (node) => {
      state.selectedNodes.push(node);
    },
    setBreakerCount: (count) => {
      state.breakerCount = count;
      eventBus.emit("breakers:update", count);
    },
    setProcessing: (processing) => {
      state.isProcessing = processing;
    },
    setTraced: (value) => {
      state.isBeingTraced = value;
    },
    setSoundEnabled: (enabled) => {
      state.isSoundEnabled = enabled;
    },

    // Node-related
    addHiddenNode: (node) => {
      state.hiddenNodes.add(node);
    },
    removeHiddenNode: (node) => {
      state.hiddenNodes.delete(node);
    },
    clearHiddenNodes: () => {
      state.hiddenNodes.clear();
    },

    // Event subscription
    on: eventBus.on,
    off: eventBus.off,

    reset: () => {
      state.highScore =
        parseInt(localStorage.getItem("nodebreaker_highscore")) || 0;
      state.isBeingTraced = false;
      state.gameAlreadyInitialized = true;
      state.score = 0;
      state.selectedNodes = [];
      state.breakerCount = 0;
      state.isProcessing = false;
      state.hiddenNodes.clear();
    },

    showGameOver: (reason = "") => {
      state.isProcessing = true;
      const isNewHighScore = state.score > state.highScore;
      if (isNewHighScore) {
        state.highScore = state.score;
        localStorage.setItem("nodebreaker_highscore", state.highScore);
      }
      eventBus.emit("game:over", { reason, score: state.score, highScore: state.highScore, isNewHighScore });
    },
    showWin: (reason = "") => {
      state.isProcessing = true;
      const isNewHighScore = state.score > state.highScore;
      if (isNewHighScore) {
        state.highScore = state.score;
        localStorage.setItem("nodebreaker_highscore", state.highScore);
      }
      eventBus.emit("game:win", { reason, score: state.score, highScore: state.highScore, isNewHighScore });
    },
    getHighScore: () => state.highScore,
  };
};
