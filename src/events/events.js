export const Events = {
  // ── Domain Events (emitted by game logic, consumed by controller) ──
  GAME_OVER: "game:over",       // emitter: game          | listeners: audio
  GAME_WIN: "game:win",        // emitter: game          | listeners: audio
  GAME_RESET: "game:reset",    // emitter: ui            | listeners: index
  INPUT_CLICK: "input:click",  // emitter: input         | listeners: game

  // ── State Events (emitted by store, consumed by UI) ──
  SCORE_UPDATE: "score:update",       // emitter: gameState, game | listeners: ui
  BREAKERS_UPDATE: "breakers:update", // emitter: gameState, game | listeners: ui
  SCORE_INITIALIZE: "score:initialize",       // emitter: game | listeners: ui
  BREAKERS_INITIALIZE: "breakers:initialize", // emitter: game | listeners: ui
  RESET_INITIALIZE: "reset:initialize",       // emitter: game | listeners: ui
  MUSIC_BTN_INITIALIZE: "musicBtn:initialize",// emitter: game | listeners: ui
  LEADERBOARD_BTN_INITIALIZE: "leaderboardBtn:initialize",// emitter: game | listeners: ui

  // ── View Events (emitted by controller, consumed by render/ui) ──
  SCENE_FLASH: "scene:flash",   // emitter: game         | listeners: render
  MESSAGE_SHOW: "message:show", // emitter: game         | listeners: ui
  MESSAGE_HIDE: "message:hide", // emitter: game, index  | listeners: ui
  MODAL_SHOW: "modal:show",     // emitter: game         | listeners: ui

  // ── Camera Events (emitted by render, consumed by controller) ──
  CAMERA_FOCUSED: "camera:focused", // emitter: render | listeners: game
};
