import { GameConfig } from "../config/gameConfig.js";

export const UIService = (eventBus, gameState, renderService, audioService) => {
  const htmlElements = {
    score: document.getElementById("score"),
    breakers: document.getElementById("breakers"),
    message: document.getElementById("message"),
  };

  const uiState = {
    typingSpeed: 15,
    randomCharHoldTime: 20,
    textColor: GameConfig.colors.textColor,
    caretColor: GameConfig.colors.caretColor,
    randomChars:
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    isAnimating: false,
  };

  const initialize = () => {
    Object.keys(htmlElements).forEach((elementId) => {
      applyElementStyles(elementId);
    });
  };

  // Event listeners: initializers

  eventBus.on("score:initialize", (score) =>
    terminalTextAnimation("score", `Score: ${score}`),
  );

  eventBus.on("breakers:initialize", (breakers) =>
    terminalTextAnimation("breakers", `Breakers: ${breakers}`),
  );

  eventBus.on("reset:initialize", () => {
    const resetButton = document.querySelector(".reset-button");
    const progressOverlay = document.querySelector(".reset-progress-overlay");
    const progressBar = progressOverlay.querySelector(".reset-progress");
    let progressInterval;
    const progressDuration = 2000;
    const blocks = 4;
    const blockChar = "█";

    resetButton.classList.add("generic-fadein");

    let pressTimer;

    resetButton.addEventListener("mousedown", (event) => {
      if (gameState.isProcessing()) {
        return;
      }
      event.preventDefault();

      progressOverlay.style.display = "block";
      let currentBlock = 0;
      const intervalTime = progressDuration / blocks;

      progressInterval = setInterval(() => {
        currentBlock++;
        const progress = blockChar.repeat(currentBlock);
        progressBar.textContent = `[${progress}]`;

        if (currentBlock >= blocks) {
          clearInterval(progressInterval);
          progressOverlay.style.display = "none";
          progressBar.textContent = `[ ]`;
          eventBus.emit("game:reset");
        }
      }, intervalTime);

      pressTimer = setTimeout(() => {
        eventBus.emit("game:reset");
      }, 2000);
    });

    resetButton.addEventListener("mouseup", (event) => {
      if (gameState.isProcessing()) {
        return;
      }
      event.preventDefault();
      clearInterval(progressInterval);
      progressOverlay.style.display = "none";
      progressBar.textContent = "[ ]";
      clearTimeout(pressTimer);
    });

    let touchStartTime;

    resetButton.addEventListener(
      "touchstart",
      (event) => {
        if (gameState.isProcessing()) {
          return;
        }
        event.preventDefault();

        progressOverlay.style.display = "block";
        let currentBlock = 0;
        const intervalTime = progressDuration / blocks;

        progressInterval = setInterval(() => {
          currentBlock++;
          const progress = blockChar.repeat(currentBlock);
          progressBar.textContent = `[${progress}]`;

          if (currentBlock >= blocks) {
            clearInterval(progressInterval);
            progressOverlay.style.display = "none";
            progressBar.textContent = `[ ]`;
            eventBus.emit("game:reset");
          }
        }, intervalTime);
        touchStartTime = Date.now();
      },
      // { passive: true },
    );

    resetButton.addEventListener(
      "touchcancel",
      (event) => {
        if (gameState.isProcessing()) {
          return;
        }
        event.preventDefault();
        clearInterval(progressInterval);
        progressOverlay.style.display = "none";
        progressBar.textContent = "[ ]";
        touchStartTime = null;
      },
      // { passive: true },
    );

    resetButton.addEventListener(
      "touchend",
      (event) => {
        if (gameState.isProcessing()) {
          return;
        }
        event.preventDefault();
        clearInterval(progressInterval);
        progressOverlay.style.display = "none";
        progressBar.textContent = "[ ]";
      },
      // { passive: true },
    );
  });

  eventBus.on("musicBtn:initialize", () => {
    if (!gameState.getGameAlreadyInitialized()) {
      const musicButton = document.querySelector(".music-button");
      const disabledLine = musicButton.querySelector(".disabled-line");
      disabledLine.style.display = "none";
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

  eventBus.on("message:show", (text) => {
    const messageElement = htmlElements.message;
    if (messageElement) {
      messageElement.innerHTML = `<span class="message-terminal-text">${text}</span>`;
      messageElement.style.animation = "fadeInOut 2s ease-in-out infinite";
    }
  });

  // Event listeners: updaters

  eventBus.on("score:update", (score) =>
    updateUiElement("score", `Score: ${score}`),
  );

  eventBus.on("breakers:update", (count) =>
    updateUiElement("breakers", `Breakers: ${count}`),
  );

  eventBus.on("message:hide", () => {
    const messageElement = htmlElements.message;
    if (messageElement) {
      messageElement.innerHTML = "";
      messageElement.style.animation = "none";
    }
  });

  eventBus.on("modal:show", ({ message }) => {
    toggleModal(true, message);
  });

  // UI update methods

  const toggleModal = (show, text = "", options = {}) => {
    const modal = document.querySelector(".modal");
    const resetButton = document.querySelector(".reset-button");
    if (modal) {
      if (show) {
        modal.style.display = "block";
        modal.classList.remove("modal-fadeout");
        gameState.setProcessing(true);
        resetButton.classList.add("disabled-element");
        if (text) {
          const modalText = modal.querySelector(".modal-text");
          if (modalText) {
            modalText.innerHTML = text;
          }
        }

        let canDismiss = !options.enforceDelay && !text.includes("GAME OVER");
        if (!canDismiss) {
          setTimeout(() => {
            canDismiss = true;
          }, 3000);
        }

        modal.onclick = () => {
          if (!canDismiss) {
            return;
          }
          modal.classList.add("modal-fadeout");
          setTimeout(() => {
            modal.style.display = "none";
            modal.classList.remove("modal-fadeout");
            resetButton.classList.remove("disabled-element");
            gameState.setProcessing(false);
            renderService.getControls().enabled = true;
          }, 2000);
        };
      } else {
        modal.classList.add("modal-fadeout");
        setTimeout(() => {
          modal.style.display = "none";
          modal.classList.remove("modal-fadeout");
          resetButton.classList.remove("disabled-element");
          gameState.setProcessing(false);
          renderService.getControls().enabled = true;
        }, 2000);
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
