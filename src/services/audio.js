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

    audioState.soundEffects.set(
      "gameOver",
      new Audio("../assets/audio/effects/game_over.mp3"),
    );

    audioState.soundEffects.set(
      "win",
      new Audio("../assets/audio/effects/win.mp3"),
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

  eventBus.on("game:over", () => {
    if (audioState.bgMusic) {
      audioState.bgMusic.volume = 0.4;
      playSoundEffect("gameOver");

      setTimeout(() => {
        const fadeDuration = 2000;
        const fadeInterval = 50;
        const startVolume = 0.5;
        const targetVolume = 1.0;
        const volumeStep =
          (targetVolume - startVolume) / (fadeDuration / fadeInterval);

        let currentVolume = startVolume;

        const fadeIn = setInterval(() => {
          currentVolume = Math.min(currentVolume + volumeStep, targetVolume);
          audioState.bgMusic.volume = currentVolume;

          if (currentVolume >= targetVolume) {
            clearInterval(fadeIn);
          }
        }, fadeInterval);
      }, 2000);
    }
  });

  eventBus.on("game:win", () => {
    if (audioState.bgMusic) {
      audioState.bgMusic.volume = 0.4;
      playSoundEffect("win");

      setTimeout(() => {
        const fadeDuration = 2000;
        const fadeInterval = 50;
        const startVolume = 0.5;
        const targetVolume = 1.0;
        const volumeStep =
          (targetVolume - startVolume) / (fadeDuration / fadeInterval);

        let currentVolume = startVolume;

        const fadeIn = setInterval(() => {
          currentVolume = Math.min(currentVolume + volumeStep, targetVolume);
          audioState.bgMusic.volume = currentVolume;

          if (currentVolume >= targetVolume) {
            clearInterval(fadeIn);
          }
        }, fadeInterval);
      }, 2000);
    }
  });

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
