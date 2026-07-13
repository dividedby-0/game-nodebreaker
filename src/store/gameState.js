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
    isSoundEnabled: true,
  };

  return {
    // State getters
    getScore: () => state.score,
    getSelectedNodes: () => [...state.selectedNodes],
    getBreakerCount: () => state.breakerCount,
    getHiddenNodes: () => state.hiddenNodes,
    isProcessing: () => state.isProcessing,
    isBeingTraced: () => state.isBeingTraced,
    getGameAlreadyInitialized: () => state.gameAlreadyInitialized,
    isSoundEnabled: () => state.isSoundEnabled,

    // State setters
    setGameAlreadyInitialized: () => {
      state.gameAlreadyInitialized = true;
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

    setHighScore: (score) => {
      state.highScore = score;
      localStorage.setItem("nodebreaker_highscore", score);
    },
    getHighScore: () => state.highScore,
  };
};
