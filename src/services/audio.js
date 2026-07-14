import { GameConfig } from "../config/gameConfig.js";

export const AudioService = (eventBus, gameState) => {
  const audioState = {
    bgMusic: null,
    soundEffects: new Map(),
    fadeTimeoutId: null,
    fadeIntervalId: null,
    currentlyPlayingEffect: null,
    prePauseVolume: null,
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
          if (gameState.isSoundEnabled()) {
            audioState.bgMusic.play().catch((error) => {
              console.log("Audio play failed:", error);
            });
          }
        },
        { once: true },
      );
    }
  };

  const fadeInMusic = (startVolume, targetVolume, duration) => {
    const stepMs = GameConfig.game.timing.fadeStepMs;
    const volumeStep = (targetVolume - startVolume) / (duration / stepMs);
    let currentVolume = startVolume;

    audioState.fadeIntervalId = setInterval(() => {
      currentVolume = Math.min(currentVolume + volumeStep, targetVolume);
      audioState.bgMusic.volume = currentVolume;

      if (currentVolume >= targetVolume) {
        clearInterval(audioState.fadeIntervalId);
        audioState.fadeIntervalId = null;
      }
    }, stepMs);
  };

  const scheduleFadeIn = (delay) => {
    audioState.fadeTimeoutId = setTimeout(() => {
      audioState.fadeTimeoutId = null;
      fadeInMusic(
        GameConfig.game.audio.fadeStartVolume,
        GameConfig.game.audio.fadeTargetVolume,
        GameConfig.game.audio.fadeDuration,
      );
    }, delay);
  };

  eventBus.on("game:over", () => {
    if (audioState.bgMusic) {
      audioState.bgMusic.volume = GameConfig.game.audio.bgVolumeAfterEvent;
      playSoundEffect("gameOver");
      scheduleFadeIn(GameConfig.game.audio.fadeDelay);
    }
  });

  eventBus.on("game:win", () => {
    if (audioState.bgMusic) {
      audioState.bgMusic.volume = GameConfig.game.audio.bgVolumeAfterEvent;
      playSoundEffect("win");
      scheduleFadeIn(GameConfig.game.audio.fadeDelay);
    }
  });

  eventBus.on("game:pause", () => {
    if (gameState.isSoundEnabled() && audioState.bgMusic) {
      audioState.prePauseVolume = audioState.bgMusic.volume;
      audioState.bgMusic.volume = GameConfig.game.audio.pauseVolume;
    }
  });

  eventBus.on("game:unpause", () => {
    if (audioState.prePauseVolume !== null && audioState.bgMusic) {
      audioState.bgMusic.volume = audioState.prePauseVolume;
      audioState.prePauseVolume = null;
    }
  });

  eventBus.on("game:reset", () => {
    if (audioState.fadeTimeoutId !== null) {
      clearTimeout(audioState.fadeTimeoutId);
      audioState.fadeTimeoutId = null;
    }
    if (audioState.fadeIntervalId !== null) {
      clearInterval(audioState.fadeIntervalId);
      audioState.fadeIntervalId = null;
    }
    if (audioState.prePauseVolume !== null && audioState.bgMusic) {
      audioState.bgMusic.volume = audioState.prePauseVolume;
      audioState.prePauseVolume = null;
    }
  });

  const playInvalidSound = () => {
    if (!gameState.isSoundEnabled()) { return; }
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = 120;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) { /* audio not available */ }
  };

  const playBonusSound = () => {
    if (!gameState.isSoundEnabled()) { return; }
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) { /* audio not available */ }
  };

  const playSoundEffect = (effectName) => {
    if (!gameState.isSoundEnabled()) { return; }
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

  return {
    initialize,
    setVolume,
    toggleSound,
    playSoundEffect,
    playInvalidSound,
    playBonusSound,
  };
};
