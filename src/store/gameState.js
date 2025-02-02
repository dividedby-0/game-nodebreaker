import { GameConfig } from "../config/gameConfig.js";

export const GameState = (eventBus, gameConfig) => {
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
      eventBus.emit("nodes:update", state.selectedNodes);
    },
    setBreakerCount: (count) => {
      state.breakerCount = count;
      eventBus.emit("breakers:update", count);
    },
    setProcessing: (processing) => {
      state.isProcessing = processing;
      eventBus.emit("processing:update", processing);
    },
    setTraced: (value) => {
      state.isBeingTraced = value;
    },
    setSoundEnabled: (enabled) => {
      state.isSoundEnabled = enabled;
      eventBus.emit("sound:toggle", enabled);
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
      eventBus.emit("state:reset");
    },

    showGameOver: (reason = "") => {
      state.isProcessing = true;
      const isNewHighScore = state.score > state.highScore;
      if (isNewHighScore) {
        state.highScore = state.score;
        localStorage.setItem("nodebreaker_highscore", state.highScore);
      }
      eventBus.emit("game:over");
      eventBus.emit("scene:flash");
      eventBus.emit("modal:show", {
        message:
          `<span style='color: #ff0000; text-shadow: 0 0 5px rgba(255, 0, 0, 0.7), 0 0 10px rgba(255, 0, 0, 0.5)'>GAME OVER${reason ? `<br><br>${reason}` : ""}</span><br><br>` +
          `Final Score: <span style='color: #00ff00; text-shadow: 0 0 5px rgba(0, 255, 0, 0.7), 0 0 10px rgba(0, 255, 0, 0.5)'>${state.score}</span><br>` +
          (isNewHighScore
            ? "<span style='color: #ffff00'>New High Score! :O</span>"
            : `Your highest score: <span style='color: #00ff00; text-shadow: 0 0 5px rgba(0, 255, 0, 0.7), 0 0 10px rgba(0, 255, 0, 0.5)'>${state.highScore}</span>`) +
          "<br><br>(Tap to dismiss)",
        enforceDelay: true,
      });
    },
    showWin: (reason = "") => {
      state.isProcessing = true;
      const isNewHighScore = state.score > state.highScore;
      if (isNewHighScore) {
        state.highScore = state.score;
        localStorage.setItem("nodebreaker_highscore", state.highScore);
      }
      eventBus.emit("game:win");
      eventBus.emit("modal:show", {
        message:
          `<span style='color: #00ff00; text-shadow: 0 0 5px rgba(0, 255, 0, 0.7), 0 0 10px rgba(0, 255, 0, 0.5)'>GOOD JOB!${reason ? `<br><br>${reason}` : ""}</span><br><br>` +
          `Final Score: <span style='color: #00ff00; text-shadow: 0 0 5px rgba(0, 255, 0, 0.7), 0 0 10px rgba(0, 255, 0, 0.5)'>${state.score}</span><br>` +
          (isNewHighScore
            ? "<span style='color: #ffff00'>New High Score! :O</span>"
            : `Your highest score: <span style='color: #00ff00; text-shadow: 0 0 5px rgba(0, 255, 0, 0.7), 0 0 10px rgba(0, 255, 0, 0.5)'>${state.highScore}</span>`) +
          "<br><br>(Tap to dismiss)",
        enforceDelay: true,
      });
    },
    getHighScore: () => state.highScore,
  };
};
