const stores = new Map();

function createMMKV(config = {}) {
  const id = config.id ?? 'default';

  if (!stores.has(id)) {
    stores.set(id, new Map());
  }

  const store = stores.get(id);

  return {
    set(key, value) {
      store.set(key, String(value));
    },
    getString(key) {
      return store.has(key) ? store.get(key) : undefined;
    },
    getBoolean(key) {
      if (!store.has(key)) {
        return undefined;
      }

      return store.get(key) === 'true';
    },
    getNumber(key) {
      if (!store.has(key)) {
        return undefined;
      }

      return Number(store.get(key));
    },
    remove(key) {
      return store.delete(key);
    },
  };
}

module.exports = {
  createMMKV,
};
