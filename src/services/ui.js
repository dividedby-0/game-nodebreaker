export const UIService = (eventBus, gameState, renderService) => {
  const htmlElements = {
    score: document.getElementById("score"),
    breakers: document.getElementById("breakers"),
    message: document.getElementById("message"),
  };

  const uiState = {
    typingSpeed: 15,
    randomCharHoldTime: 25,
    textColor: "#00ff00",
    caretColor: "#00ff00",
    randomChars: "!@#$%^&*()_+-=[]{}|;:,.<>?/~",
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
    resetButton.classList.add("reset-fadein");

    let pressTimer;

    resetButton.addEventListener("mousedown", () => {
      pressTimer = setTimeout(() => {
        eventBus.emit("game:reset");
      }, 1000); // Hold for 1 sec
    });

    resetButton.addEventListener("mouseup", () => {
      clearTimeout(pressTimer);
    });

    let touchStartTime;
    const HOLD_DURATION = 1000;
    resetButton.addEventListener(
      "touchstart",
      (event) => {
        event.preventDefault();
        touchStartTime = Date.now();
      },
      // { passive: true },
    );

    resetButton.addEventListener(
      "touchcancel",
      () => {
        touchStartTime = null;
      },
      // { passive: true },
    );

    resetButton.addEventListener(
      "touchend",
      (event) => {
        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - touchStartTime;

        if (touchDuration >= HOLD_DURATION) {
          eventBus.emit("game:reset");
        }
      },
      // { passive: true },
    );
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
    if (modal) {
      if (show) {
        modal.style.display = "block";
        modal.classList.remove("modal-fadeout");
        gameState.setProcessing(true);
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
            gameState.setProcessing(false);
            renderService.getControls().enabled = true;
          }, 2000);
        };
      } else {
        modal.classList.add("modal-fadeout");
        setTimeout(() => {
          modal.style.display = "none";
          modal.classList.remove("modal-fadeout");
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

          htmlElement.innerHTML = `
            <span class="${htmlElementId}-terminal-text">
              ${textBeforeCaret}
              <span class="${htmlElementId}-terminal-caret">${randomChar}</span>
            </span>`;

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
