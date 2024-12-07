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
    const gameState = GameState(eventBus);
    gameState.setProcessing(true);
    const gameConfig = GameConfig;
    const gameContainer = document.getElementById("game-container");
    const nodeNetwork = NodeNetwork(gameState, eventBus);
    const physicsService = PhysicsService(gameState, nodeNetwork, eventBus);
    const renderService = RenderService(
      gameContainer,
      gameState,
      physicsService,
      eventBus,
    );
    const gameService = GameService(
      renderService,
      nodeNetwork,
      eventBus,
      gameState,
      gameConfig,
      physicsService,
    );
    const uiService = UIService(eventBus, gameState, renderService);

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

    eventBus.on("game:reset", async () => {
      if (gameState.getGameAlreadyInitialized() === true) {
        renderService.setControls(false);
        gameState.setProcessing(true);
        gameState.reset();
        physicsService.clearConnectionLines(renderService.getScene());
        nodeNetwork.reset(renderService.getScene());
        renderService.resetCamera();
        inputService.setupEventListeners(
          renderService.getRenderer().domElement,
        );
        eventBus.emit("message:hide");
        await renderService.startGameAnimations();
        await gameService.initializeUI();
        await gameState.setProcessing(false);
        await renderService.setControls(true);
      }
    });

    viewManager.switchToView("gameView");

    if (gameState.getGameAlreadyInitialized() === false) {
      await renderService.startGameAnimations();
      await gameService.initializeUI();
      await gameState.setGameAlreadyInitialized(true);
      await gameState.setProcessing(false);
    }

    uiService.toggleModal(
      true,
      "Welcome to NodeBreaker<br><br>The blocks you see are <i>nodes</i>.<br>Tap nodes to link them.<br>" +
        "<span style='color: #ff0000; text-shadow: 0 0 5px rgba(255, 0, 0, 0.7), 0 0 10px rgba(255, 0, 0, 0.5)'>Red</span> " +
        "nodes are <i>data nodes</i>, you can only link to them if you have <i>breakers</i>.<br>" +
        "<span style='color: #ffff00; text-shadow: 0 0 5px rgba(255, 255, 0, 0.7), 0 0 10px rgba(255, 255, 0, 0.5)'>Yellow</span> " +
        "nodes give you breakers.<br>You must get all the " +
        "<span style='color: #ff0000; text-shadow: 0 0 5px rgba(255, 0, 0, 0.7), 0 0 10px rgba(255, 0, 0, 0.5)'>data</span> " +
        "nodes to win.<br>" +
        "Also, try not to get stuck.<br>" +
        "Tap and hold the <span style='color: #ff0000; text-shadow: 0 0 5px rgba(255, 0, 0, 0.7), 0 0 10px rgba(255, 0, 0, 0.5)'>(R)</span> button to reset the game.<br><br>" +
        "Good luck! ;)<br><br>" +
        "(Tap to dismiss this message)<br>",
    );
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
