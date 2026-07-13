export const EventBus = () => {
  const listeners = new Map();

  return {
    on: (event, callback) => {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event).add(callback);
    },
    emit: async (event, data) => {
      if (listeners.has(event)) {
        const callbacks = Array.from(listeners.get(event));
        await Promise.all(
          callbacks.map((callback) =>
            Promise.resolve(callback(data)).catch((error) => {
              console.error(`Error in event callback for ${event}:`, error);
            })
          )
        );
      }
    },
  };
};
