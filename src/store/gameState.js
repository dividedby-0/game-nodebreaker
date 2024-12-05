export const GameState = (eventBus) => {
  const state = {
    score: 0,
    selectedNodes: [],
    breakerCount: 0,
    timeElapsed: 0,
    timerStarted: false,
    timerInterval: null,
    isProcessing: false,
    hiddenNodes: new Set(),
    isBeingTraced: false,
  };

  return {
    // State getters
    getScore: () => state.score,
    getSelectedNodes: () => state.selectedNodes,
    getBreakerCount: () => state.breakerCount,
    getTimeElapsed: () => state.timeElapsed,
    getHiddenNodes: () => state.hiddenNodes,
    isTimerStarted: () => state.timerStarted,
    isProcessing: () => state.isProcessing,
    isBeingTraced: () => state.isBeingTraced,

    // State setters
    setScore: (score) => {
      state.score = score;
      eventBus.emit("score:update", score);
    },
    addSelectedNode: (node) => {
      state.selectedNodes.push(node);
      eventBus.emit("nodes:update", state.selectedNodes);
    },
    setBreakerCount: (count) => {
      state.breakerCount = count;
      eventBus.emit("breakers:update", count);
    },
    setTimeElapsed: (time) => {
      state.timeElapsed = time;
      eventBus.emit("timer:update", time);
    },
    setTimerStarted: (started) => {
      state.timerStarted = started;
      eventBus.emit("timer:state", started);
    },
    setProcessing: (processing) => {
      state.isProcessing = processing;
      eventBus.emit("processing:update", processing);
    },
    setTraced: (value) => {
      state.isBeingTraced = value;
    },

    // Node-related
    addHiddenNode: (node) => {
      state.hiddenNodes.add(node);
      eventBus.emit("hiddenNodes:update", Array.from(state.hiddenNodes));
    },
    removeHiddenNode: (node) => {
      state.hiddenNodes.delete(node);
      eventBus.emit("hiddenNodes:update", Array.from(state.hiddenNodes));
    },
    clearHiddenNodes: () => {
      state.hiddenNodes.clear();
      eventBus.emit("hiddenNodes:update", []);
    },

    // Timer controls
    startTimer: () => {
      if (!state.timerStarted) {
        state.timerStarted = true;
        const startTime = Date.now();
        state.timerInterval = setInterval(() => {
          const currentTime = Date.now();
          state.timeElapsed = (currentTime - startTime) / 1000;
          eventBus.emit("timer:update", state.timeElapsed);
        }, 100);
      }
    },

    stopTimer: () => {
      if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
        eventBus.emit("timer:stop");
      }
    },

    // Event subscription
    on: eventBus.on,
    off: eventBus.off,

    // Reset game state
    reset: () => {
      state.score = 0;
      state.selectedNodes = [];
      state.breakerCount = 0;
      state.timeElapsed = 0;
      state.timerStarted = false;
      if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
      }
      state.isProcessing = false;
      state.hiddenNodes.clear();
      eventBus.emit("state:reset");
    },
  };
};
