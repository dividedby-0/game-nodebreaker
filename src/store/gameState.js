const safeGetItem = (key, fallback = null) => {
  try { return localStorage.getItem(key); } catch { return fallback; }
};

const safeSetItem = (key, value) => {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
};

export const GameState = (eventBus) => {
  const state = {
    score: 0,
    highScore: parseInt(safeGetItem("nodebreaker_highscore")) || 0,
    selectedNodes: [],
    breakerCount: 0,
    isProcessing: false,
    hiddenNodes: new Set(),
    isBeingTraced: false,
    gameAlreadyInitialized: false,
    isSoundEnabled: true,
    isPaused: false,
    normalNodes: 0,
    breakableNodes: 0,
    breakerNodes: 0,
  };

  return {
    // State getters
    getScore: () => state.score,
    getSelectedNodes: () => [...state.selectedNodes],
    getBreakerCount: () => state.breakerCount,
    getHiddenNodes: () => new Set(state.hiddenNodes),
    isProcessing: () => state.isProcessing,
    isBeingTraced: () => state.isBeingTraced,
    getGameAlreadyInitialized: () => state.gameAlreadyInitialized,
    isSoundEnabled: () => state.isSoundEnabled,
    isPaused: () => state.isPaused,

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
    setPaused: (value) => {
      state.isPaused = value;
    },
    getNormalNodes: () => state.normalNodes,
    setNormalNodes: (val) => { state.normalNodes = val; },
    getBreakableNodes: () => state.breakableNodes,
    setBreakableNodes: (val) => { state.breakableNodes = val; },
    getBreakerNodes: () => state.breakerNodes,
    setBreakerNodes: (val) => { state.breakerNodes = val; },

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

    reset: () => {
      state.highScore =
        parseInt(safeGetItem("nodebreaker_highscore")) || 0;
      state.isBeingTraced = false;
      state.gameAlreadyInitialized = true;
      state.score = 0;
      state.selectedNodes = [];
      state.breakerCount = 0;
      state.isProcessing = false;
      state.isPaused = false;
      state.hiddenNodes.clear();
      state.normalNodes = 0;
      state.breakableNodes = 0;
      state.breakerNodes = 0;
    },

    setHighScore: (score) => {
      state.highScore = score;
      safeSetItem("nodebreaker_highscore", score);
    },
    getHighScore: () => state.highScore,
  };
};
