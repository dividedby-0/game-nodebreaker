export const AudioService = (eventBus, gameState) => {
  const audioState = {
    bgMusic: null,
    soundEffects: new Map(),
    fadeInterval: null,
  };

  const initialize = () => {
    audioState.bgMusic = new Audio(
      "../assets/audio/background/evasion-dark-cyberpunk-action-123274.mp3",
    );
    audioState.bgMusic.loop = true;
    audioState.bgMusic.volume = 1;

    // audioState.soundEffects.set('effect1', new Audio('../assets/audio/effects/effect1.mp3'));

    setupEventListeners();
    setupVisibilityHandler();
  };

  const setupVisibilityHandler = () => {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        audioState.bgMusic.pause();
      } else {
        if (gameState.getGameAlreadyInitialized()) {
          audioState.bgMusic.play().catch((error) => {
            console.log("Audio resume failed:", error);
          });
        }
      }
    });
  };

  const setupEventListeners = () => {
    const consentButton = document.querySelector(".consent-button");
    if (consentButton) {
      consentButton.addEventListener(
        "click",
        () => {
          audioState.bgMusic.play().catch((error) => {
            console.log("Audio play failed:", error);
          });
        },
        { once: true },
      );
    }
  };

  const setVolume = (volume) => {
    if (audioState.bgMusic) {
      audioState.bgMusic.volume = volume;
    }
  };

  return {
    initialize,
    setVolume,
  };
};
