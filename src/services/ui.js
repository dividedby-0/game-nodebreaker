export const UIService = (eventBus, gameState) => {
  const htmlElements = {
    score: document.getElementById("score"),
    timer: document.getElementById("timer"),
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

  eventBus.on("timer:initialize", (time) =>
    terminalTextAnimation("timer", `Time: ${time.toFixed(2)}s`)
  );

  eventBus.on("score:initialize", (score) =>
    terminalTextAnimation("score", `Score: ${score}`)
  );

  eventBus.on("breakers:initialize", (breakers) =>
    terminalTextAnimation("breakers", `Breakers: ${breakers}`)
  );

  eventBus.on("message:show", (text) => {
    const messageElement = htmlElements.message;
    if (messageElement) {
      messageElement.innerHTML = `<span class="message-terminal-text">${text}</span>`;
      messageElement.style.animation = "fadeInOut 2s ease-in-out infinite";
    }
  });

  // Event listeners: updaters

  eventBus.on("timer:update", (time) =>
    updateUiElement("timer", `Time: ${(time || 0).toFixed(2)}s`)
  );

  eventBus.on("score:update", (score) =>
    updateUiElement("score", `Score: ${score}`)
  );

  eventBus.on("breakers:update", (count) =>
    updateUiElement("breakers", `Breakers: ${count}`)
  );

  // UI update methods

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
      uiState.caretColor
    );

    const textElements = document.getElementsByClassName(
      `${htmlElementId}-terminal-text`
    );
    const caretElements = document.getElementsByClassName(
      `${htmlElementId}-terminal-caret`
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
        `.${htmlElementId}-terminal-caret`
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
  };
};
