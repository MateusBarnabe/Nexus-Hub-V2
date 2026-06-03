/* eslint-env browser */

(function nexusGameSdkFactory(globalScope) {
  const root = globalScope;

  const state = {
    auth: null,
    initialized: false,
  };

  function postToParent(type, payload) {
    if (!root.parent || root.parent === root) {
      return;
    }

    root.parent.postMessage({ type, payload }, '*');
  }

  function onMessage(event) {
    const data = event.data && typeof event.data === 'object' ? event.data : null;
    if (!data || data.type !== 'NEXUS_AUTH_CONTEXT') {
      return;
    }

    state.auth = data.payload;

    if (root.NexusGameSDK && typeof root.NexusGameSDK.onAuth === 'function') {
      root.NexusGameSDK.onAuth(state.auth);
    }
  }

  function init(options = {}) {
    if (state.initialized) {
      return;
    }

    state.initialized = true;
    root.addEventListener('message', onMessage);

    if (typeof options.onAuth === 'function') {
      root.NexusGameSDK.onAuth = options.onAuth;
    }

    postToParent('NEXUS_GAME_READY', {
      gameSlug: options.gameSlug || null,
      version: options.version || '1.0.0',
    });
  }

  function requestAuth() {
    postToParent('NEXUS_REQUEST_AUTH', {});
  }

  function submitScore(value, metadata = {}) {
    postToParent('NEXUS_SUBMIT_SCORE', {
      value,
      metadata,
    });
  }

  function getAuth() {
    return state.auth;
  }

  root.NexusGameSDK = {
    init,
    requestAuth,
    submitScore,
    getAuth,
    onAuth: null,
  };
})(window);
