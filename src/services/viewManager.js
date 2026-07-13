export const ViewManager = () => {
  const views = {
    loadingView: document.getElementById("loading-view"),
    audioConsentView: document.getElementById("audio-consent-view"),
    gameView: document.getElementById("game-view"),
  };

  const switchToView = (viewName) => {
    Object.values(views).forEach((view) => {
      if (view) {
        view.style.display = "none";
      }
    });

    if (views[viewName]) {
      views[viewName].style.display = "flex";
    }
  };

  const initialize = () => {
    switchToView("loadingView");
  };

  return {
    initialize,
    switchToView,
    getCurrentView: () =>
      Object.keys(views).find((key) => views[key]?.style.display === "flex"),
  };
};
