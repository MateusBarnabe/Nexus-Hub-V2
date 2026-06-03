/* eslint-env browser */

const state = {
  token: localStorage.getItem('nexus_access_token') || '',
  refreshToken: localStorage.getItem('nexus_refresh_token') || '',
  user: JSON.parse(localStorage.getItem('nexus_user') || 'null'),
  leaderboard: [],
  games: [],
};

const elements = {
  userProfile: document.querySelector('.user-profile'),
  userProfileText: document.querySelector('.user-profile span'),
  navLinks: document.querySelector('.nav-links'),
  sidebarLinks: document.querySelectorAll('.nav-links a'),
  gamesGrid: document.querySelector('.games-grid'),
  bgDefault: document.querySelector('.bg-default'),
  bgCampJump: document.querySelector('.bg-camp-jump'),
  bgSoon: document.querySelector('.bg-soon'),
};

function ensureStylesheetLoaded() {
  const hasStylesheet = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some((link) =>
    /styles\.css($|\?)/.test(link.getAttribute('href') || '')
  );

  if (!hasStylesheet) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/styles.css';
    document.head.appendChild(link);
  }
}

function injectRuntimeStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .fnx-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      z-index: 40;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .fnx-overlay.is-open {
      display: flex;
    }
    .fnx-modal {
      width: min(420px, 100%);
      background: #1f1f1f;
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 14px;
      padding: 16px;
      color: #fff;
    }
    .fnx-modal h3 {
      margin: 0 0 10px;
    }
    .fnx-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 10px;
    }
    .fnx-input {
      width: 100%;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      padding: 10px;
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
    }
    .fnx-btn {
      border: 1px solid rgba(255, 255, 255, 0.22);
      border-radius: 8px;
      padding: 9px 12px;
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      cursor: pointer;
    }
    .fnx-btn-primary {
      border-color: transparent;
      background: #00a2ff;
    }
    .fnx-feedback {
      min-height: 20px;
      margin-top: 8px;
      color: #ffb3b3;
      font-size: 0.9rem;
    }
    .fnx-score-panel {
      position: fixed;
      top: 0;
      right: -420px;
      width: min(420px, 100%);
      height: 100vh;
      background: #1b1b1b;
      border-left: 1px solid rgba(255, 255, 255, 0.14);
      color: #fff;
      z-index: 41;
      transition: right 260ms ease;
      padding: 16px;
      overflow: auto;
    }
    .fnx-score-panel.is-open {
      right: 0;
    }
    .fnx-score-list {
      list-style: none;
      margin: 14px 0 0;
      padding: 0;
      display: grid;
      gap: 8px;
    }
    .fnx-score-item {
      display: grid;
      grid-template-columns: 34px 1fr auto;
      gap: 10px;
      align-items: center;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      padding: 10px;
    }
    .fnx-score-rank {
      font-weight: 700;
      color: #8bd7ff;
    }
    .fnx-score-points {
      font-weight: 700;
    }
    .fnx-admin-link {
      color: #ffde8a !important;
    }
    .fnx-admin-link:hover {
      color: #fff4cc !important;
    }
    .fnx-list {
      list-style: none;
      margin: 10px 0 0;
      padding: 0;
      display: grid;
      gap: 8px;
      max-height: 300px;
      overflow: auto;
    }
    .fnx-list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      padding: 10px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.06);
    }
  `;
  document.head.appendChild(style);
}

function createRuntimeUI() {
  const overlay = document.createElement('div');
  overlay.className = 'fnx-overlay';
  overlay.id = 'fnxOverlay';

  const modal = document.createElement('div');
  modal.className = 'fnx-modal';
  modal.id = 'fnxModal';
  overlay.appendChild(modal);

  const scorePanel = document.createElement('aside');
  scorePanel.className = 'fnx-score-panel';
  scorePanel.id = 'fnxScorePanel';
  scorePanel.innerHTML = `
    <div class="fnx-row" style="justify-content:space-between;align-items:center;margin-top:0;">
      <h3 style="margin:0;">Leaderboard</h3>
      <button id="fnxScoreClose" class="fnx-btn" type="button">Fechar</button>
    </div>
    <div class="fnx-row">
      <select id="fnxPeriod" class="fnx-input" style="max-width:180px;">
        <option value="all">All time</option>
        <option value="week">Semana</option>
        <option value="day">Hoje</option>
      </select>
      <button id="fnxRefreshScores" class="fnx-btn fnx-btn-primary" type="button">Atualizar</button>
    </div>
    <ul id="fnxScoreList" class="fnx-score-list"></ul>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(scorePanel);

  return {
    overlay,
    modal,
    scorePanel,
    scoreCloseBtn: document.getElementById('fnxScoreClose'),
    periodSelect: document.getElementById('fnxPeriod'),
    refreshScoresBtn: document.getElementById('fnxRefreshScores'),
    scoreList: document.getElementById('fnxScoreList'),
  };
}

const runtime = {
  ui: null,
  adminLinks: [],
};

function isAdminUser() {
  return Boolean(state.user && state.user.role === 'admin');
}

function persistSession() {
  localStorage.setItem('nexus_access_token', state.token || '');
  localStorage.setItem('nexus_refresh_token', state.refreshToken || '');
  localStorage.setItem('nexus_user', JSON.stringify(state.user || null));
}

function updateUserProfileLabel() {
  if (!elements.userProfileText) {
    return;
  }

  if (state.user) {
    elements.userProfileText.textContent = `Bem vindo de volta, ${state.user.name}!`;
  } else {
    elements.userProfileText.textContent = 'Clique para fazer login';
  }

  // eslint-disable-next-line no-use-before-define
  syncAdminSidebarActions();
}

async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload && payload.message ? payload.message : 'Falha na requisicao');
  }

  return payload;
}

async function apiUpload(path, formData) {
  const headers = {};
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(`/api${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload && payload.message ? payload.message : 'Falha no upload da imagem');
  }

  return payload;
}

function setBackgroundState(activeKey) {
  const { bgDefault, bgCampJump, bgSoon } = elements;
  if (!bgDefault || !bgCampJump || !bgSoon) {
    return;
  }

  bgDefault.style.opacity = activeKey === 'default' ? '1' : '0';
  bgCampJump.style.opacity = activeKey === 'camp' ? '1' : '0';
  bgSoon.style.opacity = activeKey === 'soon' ? '1' : '0';
}

function bindCardHoverBackgrounds() {
  if (!elements.gamesGrid) {
    return;
  }

  elements.gamesGrid.addEventListener('mouseover', (event) => {
    const card = event.target.closest('.game-card');
    if (!card) {
      return;
    }

    const backgroundImage = card.getAttribute('data-bg');
    if (backgroundImage) {
      elements.bgCampJump.style.backgroundImage = `url('${backgroundImage}')`;
    }

    setBackgroundState('camp');
  });

  elements.gamesGrid.addEventListener('mouseleave', () => {
    setBackgroundState('default');
  });
}

function closeOverlay() {
  runtime.ui.overlay.classList.remove('is-open');
}

function openOverlay() {
  runtime.ui.overlay.classList.add('is-open');
}

async function performLogin(email, password) {
  const payload = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  state.token = payload.tokens.access.token;
  state.refreshToken = payload.tokens.refresh.token;
  state.user = payload.user;
  persistSession();
  updateUserProfileLabel();
  // eslint-disable-next-line no-use-before-define
  await loadGamesCatalog();
}

async function performLogout() {
  try {
    if (state.refreshToken) {
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: state.refreshToken }),
      });
    }
  } catch (error) {
    // Ignore API logout errors and always clear local session.
  }

  state.token = '';
  state.refreshToken = '';
  state.user = null;
  persistSession();
  updateUserProfileLabel();
  // eslint-disable-next-line no-use-before-define
  await loadGamesCatalog();
}

function renderLoginModal() {
  runtime.ui.modal.innerHTML = `
    <h3>Entrar no Nexus Score</h3>
    <form id="fnxLoginForm">
      <label>
        Email
        <input id="fnxEmail" class="fnx-input" type="email" required placeholder="admin@nexus.local" />
      </label>
      <label style="margin-top:10px;display:block;">
        Senha
        <input id="fnxPassword" class="fnx-input" type="password" required placeholder="Admin@123" />
      </label>
      <div class="fnx-row">
        <button type="submit" class="fnx-btn fnx-btn-primary">Entrar</button>
        <button type="button" id="fnxCancel" class="fnx-btn">Cancelar</button>
      </div>
      <p id="fnxFeedback" class="fnx-feedback"></p>
    </form>
  `;

  const form = document.getElementById('fnxLoginForm');
  const feedback = document.getElementById('fnxFeedback');
  const cancelBtn = document.getElementById('fnxCancel');

  cancelBtn.addEventListener('click', closeOverlay);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('fnxEmail').value.trim();
    const password = document.getElementById('fnxPassword').value;

    feedback.textContent = 'Autenticando...';
    try {
      await performLogin(email, password);
      closeOverlay();
    } catch (error) {
      feedback.textContent = error.message;
    }
  });
}

function renderAccountModal() {
  runtime.ui.modal.innerHTML = `
    <h3>Conta</h3>
    <p style="margin:0;opacity:0.9;">Logado como <strong>${state.user.name}</strong> (${state.user.role}).</p>
    <div class="fnx-row">
      <button type="button" id="fnxLogout" class="fnx-btn fnx-btn-primary">Sair</button>
      <button type="button" id="fnxCloseAccount" class="fnx-btn">Fechar</button>
    </div>
  `;

  document.getElementById('fnxLogout').addEventListener('click', async () => {
    await performLogout();
    closeOverlay();
  });
  document.getElementById('fnxCloseAccount').addEventListener('click', closeOverlay);
}

function openLoginPopup() {
  if (state.user) {
    renderAccountModal();
  } else {
    renderLoginModal();
  }
  openOverlay();
}

function getGameTags(game) {
  const tags = [];

  if (game.config && typeof game.config === 'object') {
    if (game.config.category) {
      tags.push(String(game.config.category));
    }
    if (game.config.difficulty) {
      tags.push(String(game.config.difficulty));
    }
  }

  if (!tags.length) {
    tags.push('Arcade', 'Jogo');
  }

  return tags.slice(0, 3);
}

function renderGamesGrid() {
  if (!elements.gamesGrid) {
    return;
  }

  if (!state.games.length) {
    elements.gamesGrid.innerHTML = `
      <article class="game-card coming-soon" tabindex="0">
        <div class="card-content">
          <h3>Nenhum jogo ativo</h3>
          <div class="tags"><span>Cadastre no admin</span></div>
        </div>
      </article>
    `;
    return;
  }

  elements.gamesGrid.innerHTML = state.games
    .map((game, index) => {
      const tags = getGameTags(game);
      const launchUrl = game.config && game.config.launchUrl ? String(game.config.launchUrl).trim() : '';
      const imageUrl = game.imageUrl && String(game.imageUrl).trim() ? String(game.imageUrl).trim() : 'em-breve-thumb.jpg';
      const classes = index === 0 ? 'game-card item-1' : 'game-card coming-soon';

      return `
      <article class="${classes}" tabindex="0" data-game-id="${
        game.id
      }" data-game-url="${launchUrl}" data-bg="${imageUrl}" style="background-image:url('${imageUrl}')">
        <div class="card-content">
          <h3>${game.title}</h3>
          <div class="tags">${tags.map((tag) => `<span>${tag}</span>`).join('')}</div>
        </div>
      </article>
    `;
    })
    .join('');
}

async function loadGamesCatalog() {
  try {
    const data = await apiFetch('/games?isActive=true&limit=50&page=1&sortBy=createdAt:desc');
    state.games = Array.isArray(data.results) ? data.results : [];
  } catch (error) {
    state.games = [];
  }

  renderGamesGrid();
}

function syncAdminSidebarActions() {
  runtime.adminLinks.forEach((item) => item.remove());
  runtime.adminLinks = [];

  if (!isAdminUser() || !elements.navLinks) {
    return;
  }

  const addLink = document.createElement('a');
  addLink.href = '#';
  addLink.className = 'fnx-admin-link';
  addLink.title = 'Adicionar jogo';
  addLink.innerHTML = '<i class="fas fa-plus-square"></i>';

  const removeLink = document.createElement('a');
  removeLink.href = '#';
  removeLink.className = 'fnx-admin-link';
  removeLink.title = 'Remover jogo';
  removeLink.innerHTML = '<i class="fas fa-trash-alt"></i>';

  const editLink = document.createElement('a');
  editLink.href = '#';
  editLink.className = 'fnx-admin-link';
  editLink.title = 'Editar jogo';
  editLink.innerHTML = '<i class="fas fa-edit"></i>';

  const notifWrapper = elements.navLinks.querySelector('.notif-wrapper');
  if (notifWrapper) {
    elements.navLinks.insertBefore(addLink, notifWrapper);
    elements.navLinks.insertBefore(editLink, notifWrapper);
    elements.navLinks.insertBefore(removeLink, notifWrapper);
  } else {
    elements.navLinks.appendChild(addLink);
    elements.navLinks.appendChild(editLink);
    elements.navLinks.appendChild(removeLink);
  }

  addLink.addEventListener('click', (event) => {
    event.preventDefault();
    // eslint-disable-next-line no-use-before-define
    openAddGameModal();
  });
  removeLink.addEventListener('click', (event) => {
    event.preventDefault();
    // eslint-disable-next-line no-use-before-define
    openRemoveGameModal();
  });

  editLink.addEventListener('click', (event) => {
    event.preventDefault();
    // eslint-disable-next-line no-use-before-define
    openEditGameModal();
  });

  runtime.adminLinks = [addLink, editLink, removeLink];
}

function openAddGameModal() {
  if (!isAdminUser()) {
    return;
  }

  runtime.ui.modal.innerHTML = `
    <h3>Adicionar jogo</h3>
    <form id="fnxAddGameForm">
      <label>
        Slug
        <input id="fnxGameSlug" class="fnx-input" required placeholder="meu-jogo" />
      </label>
      <label style="margin-top:8px;display:block;">
        Titulo
        <input id="fnxGameTitle" class="fnx-input" required placeholder="Meu Jogo" />
      </label>
      <label style="margin-top:8px;display:block;">
        Descricao
        <input id="fnxGameDescription" class="fnx-input" placeholder="Descricao curta" />
      </label>
      <label style="margin-top:8px;display:block;">
        Imagem URL
        <input id="fnxGameImage" class="fnx-input" placeholder="https://..." />
      </label>
      <label style="margin-top:8px;display:block;">
        Upload de imagem
        <input id="fnxGameImageFile" class="fnx-input" type="file" accept="image/*" />
      </label>
      <div class="fnx-row" style="margin-top:8px;">
        <button type="button" id="fnxUploadImage" class="fnx-btn">Fazer upload e usar URL</button>
      </div>
      <label style="margin-top:8px;display:block;">
        Launch URL
        <input id="fnxGameLaunch" class="fnx-input" placeholder="https://games.meudominio.com/jogo" />
      </label>
      <div class="fnx-row">
        <button type="submit" class="fnx-btn fnx-btn-primary">Salvar</button>
        <button type="button" id="fnxAddCancel" class="fnx-btn">Cancelar</button>
      </div>
      <p id="fnxAddFeedback" class="fnx-feedback"></p>
    </form>
  `;

  document.getElementById('fnxAddCancel').addEventListener('click', closeOverlay);
  document.getElementById('fnxUploadImage').addEventListener('click', async () => {
    const feedback = document.getElementById('fnxAddFeedback');
    const fileInput = document.getElementById('fnxGameImageFile');
    const imageField = document.getElementById('fnxGameImage');

    if (!fileInput.files || !fileInput.files[0]) {
      feedback.textContent = 'Selecione um arquivo de imagem para upload.';
      return;
    }

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);

    feedback.textContent = 'Enviando imagem...';
    try {
      const upload = await apiUpload('/games/upload-image', formData);
      imageField.value = upload.imageUrl;
      feedback.textContent = 'Imagem enviada com sucesso.';
    } catch (error) {
      feedback.textContent = error.message;
    }
  });

  document.getElementById('fnxAddGameForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const feedback = document.getElementById('fnxAddFeedback');
    const slug = document.getElementById('fnxGameSlug').value.trim().toLowerCase();
    const title = document.getElementById('fnxGameTitle').value.trim();
    const description = document.getElementById('fnxGameDescription').value.trim();
    const imageUrl = document.getElementById('fnxGameImage').value.trim();
    const launchUrl = document.getElementById('fnxGameLaunch').value.trim();

    feedback.textContent = 'Salvando...';
    try {
      await apiFetch('/games', {
        method: 'POST',
        body: JSON.stringify({
          slug,
          title,
          description: description || null,
          imageUrl: imageUrl || null,
          isActive: true,
          config: {
            launchUrl: launchUrl || undefined,
            embed: true,
          },
        }),
      });

      await loadGamesCatalog();
      closeOverlay();
    } catch (error) {
      feedback.textContent = error.message;
    }
  });

  openOverlay();
}

function renderRemoveGamesList() {
  const list = state.games
    .map(
      (game) => `
      <li class="fnx-list-item">
        <span>${game.title}</span>
        <button type="button" class="fnx-btn" data-remove-id="${game.id}">Remover</button>
      </li>
    `
    )
    .join('');

  return list || '<li class="fnx-list-item"><span>Nenhum jogo ativo para remover.</span></li>';
}

async function openRemoveGameModal() {
  if (!isAdminUser()) {
    return;
  }

  await loadGamesCatalog();
  runtime.ui.modal.innerHTML = `
    <h3>Remover jogo</h3>
    <p style="opacity:0.9;margin:0;">Selecione um jogo cadastrado para remover.</p>
    <ul class="fnx-list" id="fnxRemoveList">${renderRemoveGamesList()}</ul>
    <div class="fnx-row">
      <button type="button" id="fnxRemoveClose" class="fnx-btn">Fechar</button>
    </div>
    <p id="fnxRemoveFeedback" class="fnx-feedback"></p>
  `;

  document.getElementById('fnxRemoveClose').addEventListener('click', closeOverlay);
  document.getElementById('fnxRemoveList').addEventListener('click', async (event) => {
    const removeId = event.target.getAttribute('data-remove-id');
    if (!removeId) {
      return;
    }

    const feedback = document.getElementById('fnxRemoveFeedback');
    feedback.textContent = 'Removendo...';
    try {
      await apiFetch(`/games/${removeId}`, { method: 'DELETE' });
      await loadGamesCatalog();
      document.getElementById('fnxRemoveList').innerHTML = renderRemoveGamesList();
      feedback.textContent = 'Jogo removido com sucesso.';
    } catch (error) {
      feedback.textContent = error.message;
    }
  });

  openOverlay();
}

function getGameById(gameId) {
  return state.games.find((game) => Number(game.id) === Number(gameId));
}

function getSafeConfig(game) {
  if (!game || !game.config || typeof game.config !== 'object' || Array.isArray(game.config)) {
    return {};
  }

  return game.config;
}

async function openEditGameModal() {
  if (!isAdminUser()) {
    return;
  }

  await loadGamesCatalog();
  const options = state.games.map((game) => `<option value="${game.id}">${game.title}</option>`).join('');

  runtime.ui.modal.innerHTML = `
    <h3>Editar jogo</h3>
    <label>
      Selecione o jogo
      <select id="fnxEditGameSelect" class="fnx-input">${options}</select>
    </label>
    <form id="fnxEditGameForm">
      <label style="margin-top:8px;display:block;">
        Slug
        <input id="fnxEditGameSlug" class="fnx-input" required />
      </label>
      <label style="margin-top:8px;display:block;">
        Titulo
        <input id="fnxEditGameTitle" class="fnx-input" required />
      </label>
      <label style="margin-top:8px;display:block;">
        Descricao
        <input id="fnxEditGameDescription" class="fnx-input" />
      </label>
      <label style="margin-top:8px;display:block;">
        Imagem URL
        <input id="fnxEditGameImage" class="fnx-input" placeholder="https://..." />
      </label>
      <label style="margin-top:8px;display:block;">
        Upload de imagem
        <input id="fnxEditGameImageFile" class="fnx-input" type="file" accept="image/*" />
      </label>
      <div class="fnx-row" style="margin-top:8px;">
        <button type="button" id="fnxEditUploadImage" class="fnx-btn">Upload e usar URL</button>
      </div>
      <label style="margin-top:8px;display:block;">
        Launch URL
        <input id="fnxEditGameLaunch" class="fnx-input" placeholder="https://games.meudominio.com/jogo" />
      </label>
      <label style="margin-top:8px;display:block;">
        Categoria
        <input id="fnxEditGameCategory" class="fnx-input" placeholder="arcade" />
      </label>
      <label style="margin-top:8px;display:block;">
        Dificuldade
        <input id="fnxEditGameDifficulty" class="fnx-input" placeholder="normal" />
      </label>
      <div class="fnx-row">
        <button type="submit" class="fnx-btn fnx-btn-primary">Salvar alteracoes</button>
        <button type="button" id="fnxEditCancel" class="fnx-btn">Cancelar</button>
      </div>
      <p id="fnxEditFeedback" class="fnx-feedback"></p>
    </form>
  `;

  const select = document.getElementById('fnxEditGameSelect');
  const feedback = document.getElementById('fnxEditFeedback');

  const fillEditForm = (gameId) => {
    const game = getGameById(gameId);
    if (!game) {
      return;
    }

    const config = getSafeConfig(game);
    document.getElementById('fnxEditGameSlug').value = game.slug || '';
    document.getElementById('fnxEditGameTitle').value = game.title || '';
    document.getElementById('fnxEditGameDescription').value = game.description || '';
    document.getElementById('fnxEditGameImage').value = game.imageUrl || '';
    document.getElementById('fnxEditGameLaunch').value = config.launchUrl || '';
    document.getElementById('fnxEditGameCategory').value = config.category || '';
    document.getElementById('fnxEditGameDifficulty').value = config.difficulty || '';
  };

  fillEditForm(select.value);
  select.addEventListener('change', () => {
    fillEditForm(select.value);
  });

  document.getElementById('fnxEditCancel').addEventListener('click', closeOverlay);

  document.getElementById('fnxEditUploadImage').addEventListener('click', async () => {
    const fileInput = document.getElementById('fnxEditGameImageFile');
    const imageField = document.getElementById('fnxEditGameImage');

    if (!fileInput.files || !fileInput.files[0]) {
      feedback.textContent = 'Selecione um arquivo de imagem para upload.';
      return;
    }

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);

    feedback.textContent = 'Enviando imagem...';
    try {
      const upload = await apiUpload('/games/upload-image', formData);
      imageField.value = upload.imageUrl;
      feedback.textContent = 'Imagem enviada com sucesso.';
    } catch (error) {
      feedback.textContent = error.message;
    }
  });

  document.getElementById('fnxEditGameForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const game = getGameById(select.value);
    if (!game) {
      feedback.textContent = 'Jogo selecionado nao encontrado.';
      return;
    }

    const prevConfig = getSafeConfig(game);
    const launchUrl = document.getElementById('fnxEditGameLaunch').value.trim();
    const category = document.getElementById('fnxEditGameCategory').value.trim();
    const difficulty = document.getElementById('fnxEditGameDifficulty').value.trim();

    const config = {
      ...prevConfig,
      launchUrl: launchUrl || undefined,
      category: category || undefined,
      difficulty: difficulty || undefined,
    };

    if (!launchUrl) {
      delete config.launchUrl;
    }
    if (!category) {
      delete config.category;
    }
    if (!difficulty) {
      delete config.difficulty;
    }

    const payload = {
      slug: document.getElementById('fnxEditGameSlug').value.trim().toLowerCase(),
      title: document.getElementById('fnxEditGameTitle').value.trim(),
      description: document.getElementById('fnxEditGameDescription').value.trim() || null,
      imageUrl: document.getElementById('fnxEditGameImage').value.trim() || null,
      config,
    };

    feedback.textContent = 'Salvando alteracoes...';
    try {
      await apiFetch(`/games/${game.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      await loadGamesCatalog();
      closeOverlay();
    } catch (error) {
      feedback.textContent = error.message;
    }
  });

  openOverlay();
}

async function loadLeaderboard(period = 'all') {
  const data = await apiFetch(`/scores/leaderboard?period=${encodeURIComponent(period)}&limit=20&page=1`);
  state.leaderboard = Array.isArray(data.results) ? data.results : [];
}

function renderLeaderboardList() {
  if (!runtime.ui.scoreList) {
    return;
  }

  if (!state.leaderboard.length) {
    runtime.ui.scoreList.innerHTML =
      '<li class="fnx-score-item"><span>-</span><span>Sem scores ainda</span><span>0</span></li>';
    return;
  }

  runtime.ui.scoreList.innerHTML = state.leaderboard
    .map(
      (entry) => `
      <li class="fnx-score-item">
        <span class="fnx-score-rank">#${entry.rank}</span>
        <span>${entry.user.name}</span>
        <span class="fnx-score-points">${entry.totalScore}</span>
      </li>
    `
    )
    .join('');
}

async function openScorePanel() {
  const period = runtime.ui.periodSelect.value;
  await loadLeaderboard(period);
  renderLeaderboardList();
  runtime.ui.scorePanel.classList.add('is-open');
}

function closeScorePanel() {
  runtime.ui.scorePanel.classList.remove('is-open');
}

function bindSidebarActions() {
  const links = Array.from(elements.sidebarLinks);
  if (links.length < 3) {
    return;
  }

  links[0].title = 'Inicio';
  links[1].title = 'Score';
  links[2].title = 'Mensagens';

  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
    });
  });

  links[1].addEventListener('click', () => {
    openScorePanel().catch(() => {
      runtime.ui.scoreList.innerHTML =
        '<li class="fnx-score-item"><span>-</span><span>Falha ao carregar ranking</span><span>!</span></li>';
      runtime.ui.scorePanel.classList.add('is-open');
    });
  });

  links[0].addEventListener('click', () => {
    closeScorePanel();
  });
}

function bindGameCardActions() {
  if (!elements.gamesGrid) {
    return;
  }

  elements.gamesGrid.addEventListener('click', (event) => {
    const card = event.target.closest('.game-card');
    if (!card) {
      return;
    }

    const gameId = card.getAttribute('data-game-id');
    if (gameId) {
      state.currentGame = getGameById(gameId);
    }

    const launchUrl = card.getAttribute('data-game-url');
    if (launchUrl) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      window.open(launchUrl, '_blank', 'noopener');
    }
  });
}

function bindEvents() {
  if (elements.userProfile) {
    elements.userProfile.addEventListener('click', () => {
      openLoginPopup();
    });
  }

  window.openLoginPopup = openLoginPopup;

  // Ouvinte de mensagens do iframe ou nova aba do jogo para capturar o Score
  window.addEventListener('message', async (event) => {
    const data = event.data && typeof event.data === 'object' ? event.data : null;
    if (!data || data.type !== 'NEXUS_SUBMIT_SCORE') {
      return;
    }

    const { value, metadata } = data.payload || {};
    
    // Obtém o jogo ativo que está rodando.
    const activeGame = state.currentGame || state.games[0];
    if (!activeGame) {
      console.error('Nenhum jogo ativo no estado para associar o score.');
      return;
    }

    if (!state.user) {
      console.error('Usuário não logado. O score não será registrado.');
      return;
    }

    console.log(`Recebido score do game: ${value} para o jogo: ${activeGame.slug}`);

    try {
      await apiFetch('/scores', {
        method: 'POST',
        body: JSON.stringify({
          userId: state.user.id,
          gameSlug: activeGame.slug,
          value: Number(value),
          metadata: typeof metadata === 'object' ? JSON.stringify(metadata) : String(metadata || '')
        })
      });
      console.log('Score enviado com sucesso para a API do backend!');
      // Atualiza o ranking lateral se ele estiver visível
      if (runtime.ui.scorePanel.classList.contains('is-open')) {
        await openScorePanel();
      }
    } catch (error) {
      console.error('Erro ao enviar score:', error.message);
    }
  });

  runtime.ui.overlay.addEventListener('click', (event) => {
    if (event.target === runtime.ui.overlay) {
      closeOverlay();
    }
  });

  runtime.ui.scoreCloseBtn.addEventListener('click', closeScorePanel);
  runtime.ui.refreshScoresBtn.addEventListener('click', () => {
    openScorePanel().catch(() => {
      runtime.ui.scoreList.innerHTML =
        '<li class="fnx-score-item"><span>-</span><span>Falha ao carregar ranking</span><span>!</span></li>';
    });
  });
  runtime.ui.periodSelect.addEventListener('change', () => {
    openScorePanel().catch(() => {
      runtime.ui.scoreList.innerHTML =
        '<li class="fnx-score-item"><span>-</span><span>Falha ao carregar ranking</span><span>!</span></li>';
    });
  });

  bindSidebarActions();
  bindCardHoverBackgrounds();
  bindGameCardActions();
}

async function bootstrap() {
  ensureStylesheetLoaded();
  injectRuntimeStyles();
  runtime.ui = createRuntimeUI();
  updateUserProfileLabel();
  setBackgroundState('default');
  await loadGamesCatalog();
  bindEvents();
}

bootstrap().catch(() => {
  setBackgroundState('default');
});
