import * as THREE from "../lib/three.module.js";
import { ViewManager } from "./services/viewManager.js";
import { GameState } from "./store/gameState.js";
import { NodeNetwork } from "./components/NodeNetwork/index.js";
import { VisualService } from "./services/visualService.js";
import { LineManager } from "./services/lineManager.js";
import { GameService } from "./services/game.js";
import { RenderService } from "./services/render.js";
import { UIService } from "./services/ui.js";
import { EventBus } from "./events/eventBus.js";
import { InputService } from "./services/input.js";
import { GameConfig } from "./config/gameConfig.js";
import { AudioService } from "./services/audio.js";

const gameConfig = GameConfig;
const eventBus = EventBus();
const viewManager = ViewManager();
const gameState = GameState(eventBus);
const audioService = AudioService(eventBus, gameState);
const gameContainer = document.getElementById("game-container");
const nodeNetwork = NodeNetwork();
const visualService = VisualService();
const lineManager = LineManager(eventBus);
const renderService = RenderService(
  gameContainer,
  gameState,
  eventBus,
);
const gameService = GameService(
  renderService,
  nodeNetwork,
  eventBus,
  gameState,
  gameConfig,
  visualService,
  lineManager,
  audioService,
);
const uiService = UIService(eventBus, gameState, renderService, audioService);
const inputService = InputService(
  renderService.getCamera(),
  eventBus,
);

const onWindowResize = () => renderService.onWindowResize();

const loadAssets = async () => {
  audioService.initialize();
};

const initialize = async () => {
  viewManager.initialize();
  await loadAssets();
  viewManager.switchToView("audioConsentView");

  const audioConsentBtn = document.querySelector(".consent-button");
  audioConsentBtn.addEventListener("click", () => {
    gameState.setSoundEnabled(true);
    viewManager.switchToView("gameView");
    startGame();
  });

  const noAudioBtn = document.querySelector(".no-audio-button");
  noAudioBtn.addEventListener("click", () => {
    gameState.setSoundEnabled(false);
    viewManager.switchToView("gameView");
    startGame();
  });
};

const pickRandomGroundColor = () =>
  gameConfig.groundColors[
    Math.floor(Math.random() * gameConfig.groundColors.length)
  ];

const newRandomGroundColor = () => {
  const newGroundColor = pickRandomGroundColor();
  const groundPlanes = renderService
    .getScene()
    .children.filter((mesh) => mesh.geometry.type === "PlaneGeometry");
  groundPlanes.forEach((plane) => {
    plane.material.color.setHex(newGroundColor);
  });
};

const startGame = async () => {
  try {
    renderService.initialize();
    await Promise.all([uiService.initialize(), gameService.initialize()]);
    const randomGroundColor = pickRandomGroundColor();
    const groundA = addGroundToScene(-30, randomGroundColor);
    const groundB = addGroundToScene(30, randomGroundColor);
    renderService.setGroundMeshes([groundA, groundB]);
    nodeNetwork.addToScene(renderService.getScene());
    inputService.setupEventListeners(renderService.getRenderer().domElement);

    window.removeEventListener("resize", onWindowResize, false);
    window.addEventListener("resize", onWindowResize, false);
    eventBus.on("game:reset", async () => {
      if (gameState.isProcessing()) {
        return;
      }
      newRandomGroundColor();
      if (gameState.getGameAlreadyInitialized() === true) {
        gameState.reset();
        renderService.setControls(false);
        visualService.cancelAllAnimations();
        lineManager.stop();
        lineManager.clearConnectionLines(renderService.getScene());
        nodeNetwork.reset(renderService.getScene());
        renderService.resetCamera();
        inputService.setupEventListeners(
          renderService.getRenderer().domElement,
        );
        eventBus.emit("message:hide");

        await Promise.all([
          renderService.startGameAnimations(),
          nodeNetwork.animateNodesToPosition(),
        ]);
        await gameService.initializeUI();
        gameState.setProcessing(false);
        renderService.setControls(true);
      }
    });

    viewManager.switchToView("gameView");

    if (gameState.getGameAlreadyInitialized() === false) {
      await Promise.all([
        renderService.startGameAnimations(),
        nodeNetwork.animateNodesToPosition(),
      ]);
      await gameService.initializeUI();
      gameState.setGameAlreadyInitialized(true);
      gameState.setProcessing(false);
    }

    uiService.toggleModal(
      true,
      "Welcome to ./nodebreaker_<br><br>" +
        "The cubes you see are <i>nodes</i>.<br>" +
        "Tap nodes to link them.<br>" +
        "<span style='color: #ff4500; text-shadow: 0 0 5px rgba(255, 69, 0, 0.7), 0 0 10px rgba(255, 69, 0, 0.5)'>Red</span> " +
        "nodes are <i>data nodes</i>, you can only link to them if you have <i>breakers</i>.<br>" +
        "<span style='color: #7799cc; text-shadow: 0 0 5px rgba(119, 153, 204, 0.7), 0 0 10px rgba(119, 153, 204, 0.5)'>Violet</span> " +
        "nodes give you <i>breakers</i>.<br>" +
        "There's a limited amount of them.<br>" +
        "Link all the nodes to win.<br>" +
        "Also, try not to get stuck.<br><br>" +
        "Tap and hold the <span style='color: rgba(0, 255, 0, 0.9); text-shadow: 0 0 5px rgba(0, 255, 0, 0.7), 0 0 10px rgba(0, 255, 0, 0.5)'>(R)</span> button to reset the game any moment.<br><br>" +
        "Good luck! ;)<br><br>" +
        "(Tap to dismiss)<br>",
    );

    const modal = document.querySelector(".modal");
    const origOnClick = modal.onclick;
    modal.onclick = (e) => {
      origOnClick(e);
      setTimeout(() => {
        document.querySelector(".hint-text")?.classList.add("visible");
      }, GameConfig.game.timing.modalFadeoutDuration + 200);
    };
  } catch (error) {
    console.error("Failed to initialize game screen:", error);
    const loadingText = document.querySelector(".loading-text");
    if (loadingText) {
      loadingText.style.color = "#00ff00";
      loadingText.textContent = "Loading failed";
    }
  }
};

const addGroundToScene = (positionY, randomColor) => {
  const groundThreeColor = new THREE.Color(randomColor);
  const groundGeometry = new THREE.PlaneGeometry(700, 700, 80, 80);

  const wireframeMaterial = new THREE.MeshBasicMaterial({
    wireframe: true,
    opacity: 0.3,
    transparent: true,
    color: groundThreeColor,
  });

  const groundMesh = new THREE.Mesh(groundGeometry, wireframeMaterial);
  groundMesh.position.set(0, positionY, 0);
  groundMesh.rotation.x = -Math.PI / 4;
  renderService.getScene().add(groundMesh);
  return groundMesh;
};

window.addEventListener("load", initialize);
