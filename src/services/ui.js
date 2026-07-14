import { GameConfig } from "../config/gameConfig.js";

export const UIService = (eventBus, gameState, renderService, audioService, leaderboardService) => {
  let currentPlayerName = null;

  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const htmlElements = {
    score: document.getElementById("score"),
    breakers: document.getElementById("breakers"),
    message: document.getElementById("message"),
  };

  const uiState = {
    typingSpeed: GameConfig.game.timing.typingSpeed,
    randomCharHoldTime: GameConfig.game.timing.randomCharHoldTime,
    textColor: GameConfig.colors.textColor,
    caretColor: GameConfig.colors.caretColor,
    randomChars:
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    isAnimating: false,
  };

  const setupResetButton = () => {
    const resetButton = document.querySelector(".reset-button");
    const progressOverlay = document.querySelector(".reset-progress-overlay");
    const progressBar = progressOverlay.querySelector(".reset-progress");
    const progressDuration = GameConfig.game.timing.progressDuration;
    const blocks = GameConfig.game.timing.progressBlocks;
    const blockChar = "█";
    let progressInterval;
    let pressTimer;

    const startProgress = (event) => {
      if (gameState.isProcessing()) { return; }
      event.preventDefault();
      document.getElementById("game-container")?.classList.add("modal-active");
      progressOverlay.style.display = "block";
      let currentBlock = 0;
      const intervalTime = progressDuration / blocks;

      progressInterval = setInterval(() => {
        currentBlock++;
        const progress = blockChar.repeat(currentBlock);
        progressBar.textContent = `[${progress}]`;

        if (currentBlock >= blocks) {
          clearInterval(progressInterval);
          document.getElementById("game-container")?.classList.remove("modal-active");
          progressOverlay.style.display = "none";
          progressBar.textContent = "[ ]";
          eventBus.emit("game:reset");
        }
      }, intervalTime);

      pressTimer = setTimeout(() => {
        eventBus.emit("game:reset");
      }, progressDuration);
    };

    const cancelProgress = (event) => {
      if (gameState.isProcessing()) { return; }
      event.preventDefault();
      document.getElementById("game-container")?.classList.remove("modal-active");
      clearInterval(progressInterval);
      clearTimeout(pressTimer);
      progressOverlay.style.display = "none";
      progressBar.textContent = "[ ]";
    };

    resetButton.addEventListener("mousedown", startProgress);
    resetButton.addEventListener("mouseup", cancelProgress);
    resetButton.addEventListener("touchstart", startProgress);
    resetButton.addEventListener("touchcancel", cancelProgress);
    resetButton.addEventListener("touchend", cancelProgress);
  };

  const initialize = () => {
    Object.keys(htmlElements).forEach((elementId) => {
      applyElementStyles(elementId);
    });
    setupResetButton();
  };

  // Event listeners: initializers

  eventBus.on("score:initialize", (score) =>
    terminalTextAnimation("score", `Score: ${score}  Best: ${gameState.getHighScore()}`),
  );

  eventBus.on("breakers:initialize", (breakers) =>
    terminalTextAnimation("breakers", `Breakers: ${breakers}`),
  );

  eventBus.on("reset:initialize", () => {
    const resetButton = document.querySelector(".reset-button");
    const progressBar = document.querySelector(".reset-progress");
    resetButton.classList.add("generic-fadein");
    progressBar.textContent = "[ ]";
  });

  eventBus.on("game:reset", () => {
    const pauseOverlay = document.querySelector(".pause-overlay");
    if (pauseOverlay) {
      pauseOverlay.classList.remove("active");
    }
    document.querySelector(".music-button")?.classList.remove("disabled-element");
    document.querySelector(".reset-button")?.classList.remove("disabled-element");
    document.querySelector(".hint-text")?.classList.remove("visible");
  });

  eventBus.on("musicBtn:initialize", () => {
    if (!gameState.getGameAlreadyInitialized()) {
      const musicButton = document.querySelector(".music-button");
      const disabledLine = musicButton.querySelector(".disabled-line");
      disabledLine.style.display = gameState.isSoundEnabled() ? "none" : "block";
      musicButton.classList.add("generic-fadein");
      musicButton.addEventListener("click", (event) => {
        if (gameState.isProcessing()) {
          return;
        }
        event.preventDefault();
        const newSoundState = !gameState.isSoundEnabled();
        gameState.setSoundEnabled(newSoundState);
        audioService.toggleSound();
        disabledLine.style.display = newSoundState ? "none" : "block";
      });
    }
  });

  eventBus.on("pauseBtn:initialize", () => {
    if (!gameState.getGameAlreadyInitialized()) {
      const pauseButton = document.querySelector(".pause-button");
      const pauseOverlay = document.querySelector(".pause-overlay");
      pauseButton.classList.add("generic-fadein");
      pauseButton.addEventListener("click", (event) => {
        event.preventDefault();
        if (gameState.isProcessing()) {
          return;
        }
        if (gameState.isPaused()) {
          pauseOverlay.classList.remove("active");
          document.querySelector(".music-button")?.classList.remove("disabled-element");
          document.querySelector(".reset-button")?.classList.remove("disabled-element");
          eventBus.emit("game:unpause");
        } else {
          pauseOverlay.classList.add("active");
          document.querySelector(".music-button")?.classList.add("disabled-element");
          document.querySelector(".reset-button")?.classList.add("disabled-element");
          eventBus.emit("game:pause");
        }
      });
    }
  });

  const showLeaderboardModal = async (onDismiss) => {
    const entries = await leaderboardService.getLeaderboard();
    if (entries === null) {
      toggleModal(true, `<span style='color: #00ff00;'>Leaderboard unavailable at this moment.<br><br>(Tap to dismiss)</span>`, { onDismiss });
      return;
    }
    if (entries.length === 0) {
      toggleModal(true, `<span style='color: #00ff00;'>No scores yet.<br><br>(Tap to dismiss)</span>`, { onDismiss });
      return;
    }

    const pad = (s, w) => String(s).padStart(w);
    const padName = (s, w) => String(s).slice(0, w).padEnd(w);
    let rows = "";
    entries.forEach((e, i) => {
      const rank = i + 1;
      const isYou = e.name === currentPlayerName;
      const nameCell = isYou
        ? `<span style='color: #ffff00'>${padName(e.name, 8)}</span>`
        : padName(e.name, 8);
      rows += `| ${pad(rank, 4)} | ${nameCell} | ${pad(e.score, 7)} |\n`;
    });
    currentPlayerName = null;

    toggleModal(true,
      `<span style='font-family: VT323, monospace; font-size: 1em; color: #00ff00; white-space: pre;'>LEADERBOARD
+------+----------+---------+
| Rank | Name     | Score   |
+------+----------+---------+
${rows}+------+----------+---------+</span><br><br>` +
      `<span style='color: rgba(0, 255, 0, 0.6); font-size: 0.8em;'>(Tap to dismiss)</span>`,
      { onDismiss },
    );
  };

  eventBus.on("leaderboardBtn:initialize", () => {
    if (!gameState.getGameAlreadyInitialized()) {
      const lbButton = document.querySelector(".leaderboard-button");
      lbButton.classList.add("generic-fadein");
      lbButton.addEventListener("click", async (event) => {
        event.preventDefault();
        if (gameState.isProcessing()) { return; }
        eventBus.emit("game:pause");
        showLeaderboardModal(() => eventBus.emit("game:unpause"));
      });
    }
  });

  eventBus.on("leaderboard:prompt", async (scoreData) => {
    const entries = await leaderboardService.getLeaderboard(10);
    const qualifies = entries === null || entries.length < 10 || scoreData.score > entries[entries.length - 1].score;

    if (!qualifies) {
      leaderboardService.submitScore({ name: "ANONYMOUS", ...scoreData });
      showLeaderboardModal(() => {
        eventBus.emit("message:show", { text: "Press &amp; hold R to restart", color: "#00ff00" });
      });
      return;
    }

    const overlay = document.querySelector(".name-overlay");
    const input = overlay.querySelector(".name-input");
    const saveBtn = overlay.querySelector(".name-save-btn");
    const skipBtn = overlay.querySelector(".name-skip-btn");
    const buttonsToDisable = [
      document.querySelector(".reset-button"),
      document.querySelector(".music-button"),
      document.querySelector(".pause-button"),
      document.querySelector(".leaderboard-button"),
    ];

    input.value = "";
    overlay.classList.add("active");
    gameState.setProcessing(true);
    buttonsToDisable.forEach((b) => b?.classList.add("disabled-element"));
    setTimeout(() => input.focus(), 100);

    const submit = (name) => {
      overlay.classList.remove("active");
      buttonsToDisable.forEach((b) => b?.classList.remove("disabled-element"));
      gameState.setProcessing(false);
      currentPlayerName = name;
      leaderboardService.submitScore({ name, ...scoreData });
      showLeaderboardModal(() => {
        eventBus.emit("message:show", { text: "Press &amp; hold R to restart", color: "#00ff00" });
      });
    };

    saveBtn.onclick = () => {
      const name = input.value.trim().toUpperCase().slice(0, 8) || "PLAYER";
      submit(name);
    };

    skipBtn.onclick = () => {
      submit("ANONYMOUS");
    };

    input.onkeydown = (e) => {
      if (e.key === "Enter") {
        saveBtn.click();
      }
    };
  });

  eventBus.on("message:show", (payload) => {
    const messageElement = htmlElements.message;
    if (messageElement) {
      const text = typeof payload === "string" ? payload : payload.text;
      const color = typeof payload === "object" ? payload.color : null;
      const style = color
        ? `color: ${color}; text-shadow: 0 0 5px ${hexToRgba(color, 0.7)}, 0 0 10px ${hexToRgba(color, 0.5)};`
        : "";
      messageElement.innerHTML = `<span class="message-terminal-text" style="${style}">${text}</span>`;
      messageElement.style.animation = "fadeInOut 2s ease-in-out infinite";
    }
  });

  // Event listeners: updaters

  eventBus.on("score:update", (score) => {
    updateUiElement("score", `Score: ${score}  Best: ${gameState.getHighScore()}`);
    const el = document.querySelector(".score-terminal-text");
    if (el) {
      el.classList.remove("pop");
      el.offsetWidth;
      el.classList.add("pop");
      el.addEventListener("animationend", () => el.classList.remove("pop"), { once: true });
    }
  });

  eventBus.on("breakers:update", (count) => {
    updateUiElement("breakers", `Breakers: ${count}`);
    const el = document.querySelector(".breakers-terminal-text");
    if (el) {
      el.classList.remove("pop");
      el.offsetWidth;
      el.classList.add("pop");
      el.addEventListener("animationend", () => el.classList.remove("pop"), { once: true });
    }
  });

  eventBus.on("message:hide", () => {
    const messageElement = htmlElements.message;
    if (messageElement) {
      messageElement.innerHTML = "";
      messageElement.style.animation = "none";
    }
  });

  eventBus.on("modal:show", ({ message, onDismiss }) => {
    toggleModal(true, message, { onDismiss });
  });

  eventBus.on("score:popup", ({ position, value, color }) => {
    const vector = position.clone().project(renderService.getCamera());
    const canvas = renderService.getRenderer().domElement;
    const x = (vector.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (-vector.y * 0.5 + 0.5) * canvas.clientHeight;

    const el = document.createElement("div");
    el.className = "score-popup";
    el.textContent = `+${value}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = `#${color}`;
    el.style.textShadow = `0 0 5px #${color}, 0 0 10px #${color}`;
    document.body.appendChild(el);

    el.addEventListener("animationend", () => {
      el.remove();
    }, { once: true });
  });

  eventBus.on("trace:visuals:on", () => {
    const container = document.getElementById("game-container");
    if (container) {
      container.classList.add("trace-active");
    }
  });

  eventBus.on("trace:visuals:off", () => {
    const container = document.getElementById("game-container");
    if (container) {
      container.classList.remove("trace-active");
    }
  });

  // UI update methods

  const toggleModal = (show, text = "", options = {}) => {
    const modal = document.querySelector(".modal");
    const resetButton = document.querySelector(".reset-button");
    const gameContainer = document.getElementById("game-container");
    if (modal) {
      if (show) {
        gameContainer?.classList.add("modal-active");
        modal.style.display = "block";
        modal.classList.remove("modal-fadeout");
        gameState.setProcessing(true);
        resetButton.classList.add("disabled-element");
        document.querySelector(".pause-button")?.classList.add("disabled-element");
        document.querySelector(".leaderboard-button")?.classList.add("disabled-element");
        if (text) {
          const modalText = modal.querySelector(".modal-text");
          if (modalText) {
            modalText.innerHTML = text;
          }
        }

        let canDismiss = !options.enforceDelay;
        if (!canDismiss) {
          setTimeout(() => {
            canDismiss = true;
          }, GameConfig.game.timing.modalDismissDelay);
        }

        modal.onclick = () => {
          if (!canDismiss) {
            return;
          }
          modal.classList.add("modal-fadeout");
          setTimeout(() => {
            gameContainer?.classList.remove("modal-active");
            modal.style.display = "none";
            modal.classList.remove("modal-fadeout");
            resetButton.classList.remove("disabled-element");
            document.querySelector(".pause-button")?.classList.remove("disabled-element");
            document.querySelector(".leaderboard-button")?.classList.remove("disabled-element");
            gameState.setProcessing(false);
            renderService.getControls().enabled = true;
            options.onDismiss?.();
          }, GameConfig.game.timing.modalFadeoutDuration);
        };
      } else {
        modal.classList.add("modal-fadeout");
        setTimeout(() => {
          gameContainer?.classList.remove("modal-active");
          modal.style.display = "none";
          modal.classList.remove("modal-fadeout");
          resetButton.classList.remove("disabled-element");
          document.querySelector(".pause-button")?.classList.remove("disabled-element");
          document.querySelector(".leaderboard-button")?.classList.remove("disabled-element");
          gameState.setProcessing(false);
          renderService.getControls().enabled = true;
        }, GameConfig.game.timing.modalFadeoutDuration);
      }
    }
  };

  const updateUiElement = (elementId, text) => {
    const element = htmlElements[elementId];
    if (element) {
      element.innerHTML = `<span class="${elementId}-terminal-text">${text}</span>`;
    }
  };

  const applyElementStyles = (htmlElementId) => {
    const cssVars = {
      text: `--${htmlElementId}-terminal-text-color`,
      caret: `--${htmlElementId}-terminal-caret-color`,
    };

    document.documentElement.style.setProperty(cssVars.text, uiState.textColor);
    document.documentElement.style.setProperty(
      cssVars.caret,
      uiState.caretColor,
    );

    const textElements = document.getElementsByClassName(
      `${htmlElementId}-terminal-text`,
    );
    const caretElements = document.getElementsByClassName(
      `${htmlElementId}-terminal-caret`,
    );

    Array.from(textElements).forEach((element) => {
      element.style.color = uiState.textColor;
    });

    Array.from(caretElements).forEach((element) => {
      element.style.backgroundColor = uiState.caretColor;
    });
  };

  const terminalTextAnimation = async (htmlElementId, text) => {
    const htmlElement = htmlElements[htmlElementId];
    if (!htmlElement || uiState.isAnimating) {
      return;
    }
    try {
      uiState.isAnimating = true;
      let currentIndex = 0;

      while (currentIndex <= text.length) {
        const textBeforeCaret = text.substring(0, currentIndex);

        // Random character animation
        for (let i = 0; i < 3; i++) {
          const randomChar =
            uiState.randomChars[
              Math.floor(Math.random() * uiState.randomChars.length)
            ];

          htmlElement.innerHTML = `<span class="${htmlElementId}-terminal-text">${textBeforeCaret}<span class="${htmlElementId}-terminal-caret">${randomChar}</span></span>`;
          await delay(uiState.randomCharHoldTime);
        }

        currentIndex++;
        await delay(uiState.typingSpeed);
      }

      const caret = htmlElement.querySelector(
        `.${htmlElementId}-terminal-caret`,
      );
      if (caret) {
        caret.remove();
      }
    } catch (error) {
      console.error(`Error in typeText for ${htmlElementId}:`, error);
    } finally {
      uiState.isAnimating = false;
    }
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  return {
    initialize,
    toggleModal,
  };
};
