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
  const gameConfig = GameConfig;
  const gameContainer = document.getElementById("game-container");
  const eventBus = EventBus();
  const gameState = GameState(eventBus);
  const nodeNetwork = NodeNetwork(gameState);
  const physicsService = PhysicsService(gameState, nodeNetwork, eventBus);
  const renderService = RenderService(gameContainer, gameState, physicsService);
  const gameService = GameService(
    renderService,
    nodeNetwork,
    eventBus,
    gameState,
    gameConfig,
    physicsService
  );
  const uiService = UIService(eventBus, gameState);
  const inputService = InputService(
    renderService.getCamera(),
    eventBus,
    gameState
  );

  uiService.initialize();
  renderService.initialize();
  nodeNetwork.addToScene(renderService.getScene());
  gameService.initialize();
  inputService.setupEventListeners(renderService.getRenderer().domElement);

  window.addEventListener(
    "resize",
    () => renderService.onWindowResize(),
    false
  );
};

window.addEventListener("load", initialize);
