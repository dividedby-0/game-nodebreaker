export const AudioService = (eventBus, gameState) => {
  const audioState = {
    bgMusic: null,
    soundEffects: new Map(),
    fadeInterval: null,
    currentlyPlayingEffect: null,
  };

  const initialize = () => {
    audioState.bgMusic = new Audio(
      "../assets/audio/background/evasion-dark-cyberpunk-action-123274.mp3",
    );
    audioState.bgMusic.loop = true;
    audioState.bgMusic.volume = 1;

    audioState.soundEffects.set(
      "normalNode",
      new Audio("../assets/audio/effects/normal_node.mp3"),
    );

    audioState.soundEffects.set(
      "breakerNode",
      new Audio("../assets/audio/effects/breaker_node.mp3"),
    );

    audioState.soundEffects.set(
      "dataNode",
      new Audio("../assets/audio/effects/data_node.mp3"),
    );

    audioState.soundEffects.set(
      "traced",
      new Audio("../assets/audio/effects/traced.mp3"),
    );

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

  const playSoundEffect = (effectName) => {
    const soundEffect = audioState.soundEffects.get(effectName);
    if (soundEffect) {
      if (audioState.currentlyPlayingEffect) {
        audioState.currentlyPlayingEffect.pause();
        audioState.currentlyPlayingEffect.currentTime = 0;
      }
      soundEffect.play().catch((error) => {
        console.log(`${effectName} sound play failed:`, error);
      });
      audioState.currentlyPlayingEffect = soundEffect;
    }
  };

  const setVolume = (volume) => {
    if (audioState.bgMusic) {
      audioState.bgMusic.volume = volume;
    }
  };

  const toggleSound = () => {
    if (audioState.bgMusic) {
      if (audioState.bgMusic.paused) {
        audioState.bgMusic.play().catch((error) => {
          console.log("Audio play failed:", error);
        });
      } else {
        audioState.bgMusic.pause();
      }
    }
  };

  const getSoundEffects = () => {
    return audioState.soundEffects;
  };

  return {
    initialize,
    setVolume,
    toggleSound,
    playSoundEffect,
    getSoundEffects,
  };
};
