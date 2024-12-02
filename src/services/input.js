import * as THREE from "/lib/three.module.js";

export const InputService = (camera, eventBus, gameState) => {
  const inputState = {
    isPointerDown: false,
    pointerMoved: false,
    mouse: new THREE.Vector2(),
    raycaster: new THREE.Raycaster(),
  };

  const handleClick = (event) => {
    inputState.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    inputState.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    inputState.raycaster.setFromCamera(inputState.mouse, camera);

    eventBus.emit("input:click", {
      raycaster: inputState.raycaster,
      mouse: inputState.mouse,
    });
  };

  const setupEventListeners = (domElement) => {
    domElement.addEventListener("pointerdown", () => {
      inputState.isPointerDown = true;
      inputState.pointerMoved = false;
    });

    domElement.addEventListener("pointermove", () => {
      if (inputState.isPointerDown) {
        inputState.pointerMoved = true;
      }
    });

    domElement.addEventListener("pointerup", (event) => {
      // to avoid misclicks
      if (!inputState.pointerMoved) {
        handleClick(event);
      }
      inputState.isPointerDown = false;
      inputState.pointerMoved = false;
    });
  };

  return {
    setupEventListeners,
  };
};
