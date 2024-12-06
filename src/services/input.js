import * as THREE from "../../lib/three.module.js";

export const InputService = (camera, eventBus, gameState) => {
  const inputState = {
    isPointerDown: false,
    pointerMoved: false,
    mouse: new THREE.Vector2(),
    raycaster: new THREE.Raycaster(),
  };
  let pointerDownHandler, pointerMoveHandler, pointerUpHandler;

  const handleClick = (event) => {
    inputState.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    inputState.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    inputState.raycaster.setFromCamera(inputState.mouse, camera);

    eventBus.emit("input:click", {
      raycaster: inputState.raycaster,
      mouse: inputState.mouse,
    });
  };

  const cleanup = (domElement) => {
    if (pointerDownHandler) {
      domElement.removeEventListener("pointerdown", pointerDownHandler);
    }
    if (pointerMoveHandler) {
      domElement.removeEventListener("pointermove", pointerMoveHandler);
    }
    if (pointerUpHandler) {
      domElement.removeEventListener("pointerup", pointerUpHandler);
    }
  };

  const setupEventListeners = (domElement) => {
    cleanup(domElement);

    pointerDownHandler = () => {
      inputState.isPointerDown = true;
      inputState.pointerMoved = false;
    };

    pointerMoveHandler = () => {
      if (inputState.isPointerDown) {
        inputState.pointerMoved = true;
      }
    };

    pointerUpHandler = (event) => {
      // Avoid misclicks
      if (!inputState.pointerMoved) {
        handleClick(event);
      }
      inputState.isPointerDown = false;
      inputState.pointerMoved = false;
    };

    domElement.addEventListener("pointerdown", pointerDownHandler);
    domElement.addEventListener("pointermove", pointerMoveHandler);
    domElement.addEventListener("pointerup", pointerUpHandler);
  };

  return {
    setupEventListeners,
  };
};
