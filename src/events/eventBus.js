export const EventBus = () => {
  const listeners = new Map();

  return {
    on: (event, callback) => {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event).add(callback);
    },
    off: (event, callback) => {
      if (listeners.has(event)) {
        listeners.get(event).delete(callback);
      }
    },
    emit: async (event, data) => {
      if (listeners.has(event)) {
        const callbacks = Array.from(listeners.get(event));
        try {
          // Execute all callbacks concurrently and wrap non-promise returns in Promise.resolve
          await Promise.all(
            callbacks.map((callback) =>
              Promise.resolve(callback(data)).catch((error) => {
                console.error(`Error in event callback for ${event}:`, error);
              })
            )
          );
        } catch (error) {
          console.error(`Error emitting event ${event}:`, error);
        }
      }
    },
  };
};
