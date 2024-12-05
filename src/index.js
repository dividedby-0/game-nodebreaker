import { ViewManager } from "./services/viewManager.js";
import { GameState } from "./store/gameState.js";
import { NodeNetwork } from "./components/NodeNetwork/index.js";
import { PhysicsService } from "./services/physics.js";
import { GameService } from "./services/game.js";
import { RenderService } from "./services/render.js";
import { UIService } from "./services/ui.js";
import { EventBus } from "./events/eventBus.js";
import { InputService } from "./services/input.js";
import { GameConfig } from "./config/gameConfig.js";

const initialize = async () => {
  const eventBus = EventBus();
  const viewManager = ViewManager(eventBus);
  viewManager.initialize();

  try {
    const gameConfig = GameConfig;
    const gameContainer = document.getElementById("game-container");
    const gameState = GameState(eventBus);
    const nodeNetwork = NodeNetwork(gameState);
    const physicsService = PhysicsService(gameState, nodeNetwork, eventBus);
    const renderService = RenderService(
      gameContainer,
      gameState,
      physicsService,
    );
    const gameService = GameService(
      renderService,
      nodeNetwork,
      eventBus,
      gameState,
      gameConfig,
      physicsService,
    );
    const uiService = UIService(eventBus, gameState);

    renderService.initialize();
    await Promise.all([uiService.initialize(), gameService.initialize()]);

    const inputService = InputService(
      renderService.getCamera(),
      eventBus,
      gameState,
    );

    nodeNetwork.addToScene(renderService.getScene());
    inputService.setupEventListeners(renderService.getRenderer().domElement);

    window.addEventListener(
      "resize",
      () => renderService.onWindowResize(),
      false,
    );

    viewManager.switchToView("gameView");

    await renderService.startGameAnimations().then(gameService.initializeUI());
  } catch (error) {
    console.error("Failed to initialize game screen:", error);
    const loadingText = document.querySelector(".loading-text");
    if (loadingText) {
      loadingText.style.color = "#ff0000";
      loadingText.textContent = "Loading failed :(";
    }
  }
};

window.addEventListener("load", initialize);
