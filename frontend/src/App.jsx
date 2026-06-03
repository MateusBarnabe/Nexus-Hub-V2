import React, { useState, useEffect, useRef } from 'react';
import { 
  Gamepad2, 
  Home, 
  Trophy, 
  Settings, 
  LogOut, 
  LogIn, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  Plus, 
  X, 
  Globe, 
  Award, 
  AlertTriangle,
  Maximize2,
  Menu
} from 'lucide-react';
import './App.css';
import { Client } from '@stomp/stompjs';

// Import local assets
import campJumpImg from './assets/camp jump.jpeg';
import spaceOdysseyImg from './assets/space odyssey.jpeg';
import emBreveImg from './assets/Em breve.jpeg';

function App() {
  // Authentication state
  const [token, setToken] = useState(localStorage.getItem('nexus_access_token') || '');
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('nexus_user') || 'null');
    } catch {
      return null;
    }
  });

  // UI state
  const [activeTab, setActiveTab] = useState('hub');
  const [games, setGames] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentGame, setCurrentGame] = useState(null);
  const [hoveredBg, setHoveredBg] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Filters
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterGameId, setFilterGameId] = useState('');
  
  // Forms state
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminGameForm, setAdminGameForm] = useState({
    id: null,
    slug: '',
    title: '',
    description: '',
    imageUrl: '',
    launchUrl: '',
    embed: true,
    isActive: true
  });
  const [isEditingGame, setIsEditingGame] = useState(false);

  // Status/Alert state
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [realTimeAlert, setRealTimeAlert] = useState(null);

  const gameFrameRef = useRef(null);
  const playerRef = useRef(null);

  // Auto-scroll to player when game is selected
  useEffect(() => {
    if (currentGame && playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentGame]);

  // Native Fullscreen API invocation
  const handleFullscreen = () => {
    if (gameFrameRef.current) {
      const iframe = gameFrameRef.current;
      if (iframe.requestFullscreen) {
        iframe.requestFullscreen();
      } else if (iframe.mozRequestFullScreen) {
        iframe.mozRequestFullScreen();
      } else if (iframe.webkitRequestFullscreen) {
        iframe.webkitRequestFullscreen();
      } else if (iframe.msRequestFullscreen) {
        iframe.msRequestFullscreen();
      }
    }
  };

  // Auto-clear alert after 5 seconds
  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => setAlert({ type: '', message: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Load games list
  const loadGames = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/games');
      if (response.ok) {
        const data = await response.json();
        setGames(data);
      } else {
        setAlert({ type: 'error', message: 'Falha ao carregar catálogo de jogos.' });
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Erro ao conectar com o servidor.' });
    } finally {
      setLoading(false);
    }
  };

  // Load leaderboard ranking
  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      let url = `/api/scores/leaderboard?period=${filterPeriod}&limit=20&page=1`;
      if (filterGameId) {
        url += `&gameId=${filterGameId}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.results || []);
      } else {
        setAlert({ type: 'error', message: 'Falha ao carregar placar de líderes.' });
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Erro ao conectar com o servidor.' });
    } finally {
      setLoading(false);
    }
  };

  // Refs for tracking state inside listeners without stale closures
  const loadLeaderboardRef = useRef(loadLeaderboard);
  const activeTabRef = useRef(activeTab);
  const userRef = useRef(user);

  useEffect(() => {
    loadLeaderboardRef.current = loadLeaderboard;
  }, [loadLeaderboard]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Auto-dismiss real-time toast alert after 6 seconds
  useEffect(() => {
    if (realTimeAlert) {
      const timer = setTimeout(() => setRealTimeAlert(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [realTimeAlert]);

  // WebSocket setup for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const brokerUrl = isLocalhost 
      ? 'ws://localhost:8080/ws/websocket' 
      : `${protocol}//${host}/ws/websocket`;
    
    console.log('Connecting to WebSocket broker at:', brokerUrl);
    
    const stompClient = new Client({
      brokerURL: brokerUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: (frame) => {
        console.log('STOMP connected successfully to backend.');
        stompClient.subscribe('/topic/standings', (message) => {
          try {
            const data = JSON.parse(message.body);
            console.log('Real-time standings update received:', data);
            
            // 1. Trigger automatic refresh of leaderboard data via ref
            loadLeaderboardRef.current();
            
            // 2. Set beautiful real-time toast notification if it's not the current user
            if (!userRef.current || data.userId !== userRef.current.id) {
              setRealTimeAlert({
                id: data.id || Date.now(),
                userName: data.userName,
                gameTitle: data.gameTitle,
                value: data.value
              });
            }
          } catch (e) {
            console.error('Error parsing real-time score update:', e);
          }
        });
      },
      onStompError: (frame) => {
        console.error('STOMP protocol error:', frame.headers['message']);
      },
      onWebSocketClose: () => {
        console.log('STOMP WebSocket connection closed.');
      }
    });

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, []);

  // Load initial data
  useEffect(() => {
    loadGames();
  }, []);

  // Reload leaderboard whenever filters change or view becomes active
  useEffect(() => {
    if (activeTab === 'leaderboard') {
      loadLeaderboard();
    }
  }, [activeTab, filterPeriod, filterGameId]);

  // postMessage Listener for Game SDK Score Submissions
  useEffect(() => {
    const handleScoreMessage = async (event) => {
      const data = event.data && typeof event.data === 'object' ? event.data : null;
      if (!data || data.type !== 'NEXUS_SUBMIT_SCORE') {
        return;
      }

      const { value, metadata } = data.payload || {};
      const activeGame = currentGame || games[0];

      if (!activeGame) {
        console.error('Nenhum jogo associado para registrar o score.');
        return;
      }

      if (!user) {
        setAlert({ type: 'error', message: 'Você precisa fazer login para registrar pontuações!' });
        return;
      }

      console.log(`Score recebido do SDK do jogo: ${value} para ${activeGame.title}`);

      try {
        const response = await fetch('/api/scores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            userId: user.id,
            gameSlug: activeGame.slug,
            value: Number(value),
            metadata: typeof metadata === 'object' ? JSON.stringify(metadata) : String(metadata || '')
          })
        });

        if (response.ok) {
          const savedScore = await response.json();
          setAlert({ 
            type: 'success', 
            message: `Placar enviado com sucesso! Pontuação final calculada: ${savedScore.value}` 
          });
          // Refresh leaderboard in the background
          loadLeaderboardRef.current();
        } else {
          setAlert({ type: 'error', message: 'Erro ao gravar pontuação no servidor.' });
        }
      } catch (err) {
        console.error('Erro de rede ao enviar score:', err);
      }
    };

    window.addEventListener('message', handleScoreMessage);
    return () => window.removeEventListener('message', handleScoreMessage);
  }, [currentGame, games, user, token]);

  // Auth: Login handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      if (response.ok) {
        const payload = await response.json();
        setToken(payload.tokens.access.token);
        setUser(payload.user);
        localStorage.setItem('nexus_access_token', payload.tokens.access.token);
        localStorage.setItem('nexus_user', JSON.stringify(payload.user));
        setShowLoginModal(false);
        setLoginForm({ email: '', password: '' });
        setAlert({ type: 'success', message: `Bem-vindo, ${payload.user.name}!` });
        loadGames(); // reload in case role changed
      } else {
        const errData = await response.json();
        setAlert({ type: 'error', message: errData.message || 'Credenciais inválidas.' });
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Erro de conexão ao autenticar.' });
    }
  };

  // Auth: Logout handler
  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('nexus_access_token');
    localStorage.removeItem('nexus_user');
    setCurrentGame(null);
    setAlert({ type: 'success', message: 'Sessão encerrada com sucesso.' });
  };

  // Auto-generate slug from title in real-time
  const handleTitleChange = (e) => {
    const title = e.target.value;
    if (!isEditingGame) {
      const slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setAdminGameForm({ ...adminGameForm, title, slug });
    } else {
      setAdminGameForm({ ...adminGameForm, title });
    }
  };

  // Admin: Save/Update Game Handler
  const handleSaveGame = async (e) => {
    e.preventDefault();
    if (!user || user.role !== 'admin') return;

    const payload = {
      slug: adminGameForm.slug.trim().toLowerCase(),
      title: adminGameForm.title.trim(),
      description: adminGameForm.description.trim(),
      imageUrl: adminGameForm.imageUrl.trim(),
      config: {
        launchUrl: adminGameForm.launchUrl.trim(),
        embed: adminGameForm.embed
      }
    };

    try {
      const method = isEditingGame ? 'PUT' : 'POST';
      const endpoint = isEditingGame ? `/api/games/${adminGameForm.id}` : '/api/games';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setAlert({ 
          type: 'success', 
          message: isEditingGame ? 'Jogo atualizado com sucesso!' : 'Jogo cadastrado com sucesso!' 
        });
        setAdminGameForm({
          id: null,
          slug: '',
          title: '',
          description: '',
          imageUrl: '',
          launchUrl: '',
          embed: true,
          isActive: true
        });
        setIsEditingGame(false);
        loadGames();
      } else {
        let errMsg = 'Falha ao salvar o jogo.';
        if (response.status === 400) {
          errMsg = 'Erro de validação: Identificador (slug) de jogo já existente ou dados inválidos.';
        } else if (response.status === 401 || response.status === 403) {
          errMsg = 'Não autorizado. Verifique suas credenciais de administrador.';
        }
        setAlert({ type: 'error', message: errMsg });
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Erro ao conectar com o servidor admin.' });
    }
  };

  // Admin: Delete Game Handler
  const handleDeleteGame = async (gameId) => {
    if (!window.confirm('Tem certeza que deseja remover este jogo do catálogo?')) return;
    try {
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (response.ok) {
        setAlert({ type: 'success', message: 'Jogo removido com sucesso.' });
        loadGames();
        if (currentGame && currentGame.id === gameId) {
          setCurrentGame(null);
        }
      } else {
        setAlert({ type: 'error', message: 'Falha ao deletar o jogo.' });
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Erro ao conectar para deletar o jogo.' });
    }
  };

  // Admin: Setup edit game form
  const handleEditClick = (game) => {
    setIsEditingGame(true);
    setAdminGameForm({
      id: game.id,
      slug: game.slug || '',
      title: game.title || '',
      description: game.description || '',
      imageUrl: game.imageUrl || '',
      launchUrl: game.config && game.config.launchUrl ? game.config.launchUrl : '',
      embed: game.config && game.config.embed !== undefined ? game.config.embed : true,
      isActive: game.isActive !== undefined ? game.isActive : true
    });
  };

  // Check if current user is admin
  const isAdmin = user && user.role === 'admin';

  return (
    <div className="app-layout">
      {/* Background Layers */}
      <div className="bg-layer bg-default" style={{ opacity: hoveredBg ? 0 : 1 }}></div>
      <div className={`bg-layer bg-active`} style={{ backgroundImage: hoveredBg ? `url("${hoveredBg}")` : 'none', opacity: hoveredBg ? 1 : 0 }}></div>
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="logo-icon">
          <Gamepad2 size={32} />
        </div>

        <nav className="nav-links">
          <button 
            className={`nav-item ${activeTab === 'hub' ? 'active' : ''}`}
            onClick={() => setActiveTab('hub')}
            title="Hub de Jogos"
          >
            <Home size={24} />
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
            title="Classificação"
          >
            <Trophy size={24} />
          </button>

          {isAdmin && (
            <button 
              className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
              title="Administração"
            >
              <Settings size={24} />
            </button>
          )}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="content">
        
        {/* Dynamic header matching boilerplate top-bar */}
        <header className="top-bar">
          <div className="brand">
            {activeTab === 'hub' && (
              <>
                <h1>Nexus Hub</h1>
                <p>JOGOS DISPONÍVEIS</p>
              </>
            )}
            {activeTab === 'leaderboard' && (
              <>
                <h1>Nexus Classificação</h1>
                <p>RANKING EM TEMPO REAL</p>
              </>
            )}
            {activeTab === 'admin' && (
              <>
                <h1>Nexus Admin</h1>
                <p>GERENCIAMENTO DE CATÁLOGO</p>
              </>
            )}
          </div>
          
          <div className="user-profile" onClick={() => !user && setShowLoginModal(true)}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>Bem-vindo de volta, <strong>{user.name}</strong>!</span>
                <button onClick={(e) => { e.stopPropagation(); handleLogout(); }} className="btn-logout" style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                  [Sair]
                </button>
              </div>
            ) : (
              <span>Entrar no Nexus</span>
            )}
          </div>
        </header>

        {/* Alerts and feedbacks */}
        {alert.message && (
          <div className={`alert alert-${alert.type}`}>
            {alert.type === 'error' ? <AlertTriangle size={18} /> : <Award size={18} />}
            <span>{alert.message}</span>
          </div>
        )}

        {/* HUB TAB */}
        {activeTab === 'hub' && (
          <div>

            {/* Games Grid */}
            <div className="games-grid">
              {(() => {
                const getGameImage = (game) => {
                  if (game.slug === 'camp-jump') return campJumpImg;
                  if (game.slug === 'duelo-galactico') return spaceOdysseyImg;
                  return game.imageUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400';
                };

                const displayGames = [...games];
                while (displayGames.length < 6) {
                  displayGames.push({
                    id: `soon-${displayGames.length}`,
                    title: 'Em Breve',
                    description: 'Estamos trabalhando em um novo jogo incrível. Fique ligado!',
                    slug: 'coming-soon',
                    isComingSoon: true,
                    imageUrl: emBreveImg
                  });
                }

                return displayGames.map((game) => {
                  const isComingSoon = game.isComingSoon;
                  const gameImage = getGameImage(game);

                  return (
                    <article 
                      key={game.id} 
                      className={`game-card ${currentGame?.id === game.id ? 'active' : ''} ${isComingSoon ? 'coming-soon' : ''}`}
                      onClick={() => {
                        if (isComingSoon) {
                          setAlert({ type: 'info', message: 'Este jogo estará disponível em breve!' });
                          return;
                        }
                        setCurrentGame(game);
                        if (gameFrameRef.current && user) {
                          setTimeout(() => {
                            gameFrameRef.current.contentWindow?.postMessage({
                              type: 'NEXUS_AUTH_CONTEXT',
                              payload: { user, token }
                            }, '*');
                          }, 1000);
                        }
                      }}
                      onMouseEnter={() => setHoveredBg(gameImage)}
                      onMouseLeave={() => setHoveredBg(null)}
                      style={{ backgroundImage: `url("${gameImage}")` }}
                    >
                      <div className="card-content">
                        <h3>{game.title}</h3>
                        <div className="tags">
                          <span>{isComingSoon ? 'Em Breve' : 'Arcade'}</span>
                          {!isComingSoon && (game.config?.embed ? <span>Embed</span> : <span>Aba Externa</span>)}
                        </div>
                      </div>
                    </article>
                  );
                });
              })()}
            </div>

            {/* Embedded Player */}
            {currentGame && (
              <section ref={playerRef} className="player-dashboard">
                <div className="player-header">
                  <div className="player-title">
                    <h3>Jogando: {currentGame.title}</h3>
                    <p>SDK integrado. Suas pontuações serão salvas automaticamente.</p>
                  </div>
                  <div style={{display: 'flex', gap: '10px'}}>
                    {currentGame.config?.launchUrl && (
                      <>
                        <button 
                          onClick={handleFullscreen} 
                          className="btn btn-primary glow-btn"
                          title="Aumentar a Tela (Tela Cheia)"
                        >
                          <Maximize2 size={16} />
                          Aumentar a Tela
                        </button>
                        <a 
                          href={currentGame.config.launchUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-secondary"
                          onClick={() => {
                            // Post Auth context in new tab when clicked
                            setTimeout(() => {
                              window.open(currentGame.config.launchUrl, '_blank')?.postMessage({
                                type: 'NEXUS_AUTH_CONTEXT',
                                payload: { user, token }
                              }, '*');
                            }, 500);
                          }}
                        >
                          <Globe size={16} />
                          Jogar no Google
                        </a>
                      </>
                    )}
                    <button onClick={() => setCurrentGame(null)} className="btn btn-secondary">
                      <X size={16} />
                      Fechar
                    </button>
                  </div>
                </div>

                <div className="player-iframe-wrapper">
                  {currentGame.config?.launchUrl ? (
                    <iframe
                      ref={gameFrameRef}
                      title={currentGame.title}
                      src={currentGame.config.launchUrl}
                      allow="autoplay; fullscreen; clipboard-write"
                    ></iframe>
                  ) : (
                    <div className="empty-state" style={{marginTop: '150px'}}>
                      <p>Este jogo não possui Launch URL cadastrado para execução.</p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <section className="leaderboard-container">
            {/* Classificação Geral */}

            {/* Filter Bar */}
            <div className="filter-bar">
              <div className="filter-group">
                <label htmlFor="filterPeriod">Período</label>
                <select 
                  id="filterPeriod"
                  className="select-input"
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                >
                  <option value="all">Sempre (All Time)</option>
                  <option value="week">Esta Semana</option>
                  <option value="day">Hoje</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="filterGame">Filtrar por Jogo</label>
                <select 
                  id="filterGame"
                  className="select-input"
                  value={filterGameId}
                  onChange={(e) => setFilterGameId(e.target.value)}
                >
                  <option value="">Todos os Jogos</option>
                  {games.map((g) => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>

              <button onClick={loadLeaderboard} className="btn btn-primary" style={{height: '42px'}}>
                <RefreshCw size={16} />
                Atualizar
              </button>
            </div>

            {/* Ranking Table */}
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style={{width: '80px'}}>Posição</th>
                    <th>Jogador</th>
                    <th>E-mail</th>
                    <th style={{textAlign: 'right'}}>Pontuação Acumulada</th>
                    <th style={{textAlign: 'right', width: '120px'}}>Partidas</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.length > 0 ? (
                    leaderboard.map((entry, idx) => (
                      <tr key={entry.user?.id || idx}>
                        <td>
                          <span className={`rank-badge ${entry.rank === 1 ? 'rank-1' : entry.rank === 2 ? 'rank-2' : entry.rank === 3 ? 'rank-3' : 'rank-other'}`}>
                            {entry.rank}
                          </span>
                        </td>
                        <td style={{fontWeight: 600}}>{entry.user?.name || 'Desconhecido'}</td>
                        <td style={{color: 'var(--text-muted)'}}>{entry.user?.email || '-'}</td>
                        <td style={{textAlign: 'right'}} className="score-value">
                          {entry.totalScore.toLocaleString()} pts
                        </td>
                        <td style={{textAlign: 'right', fontWeight: 600}}>{entry.entries}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        Nenhuma pontuação registrada para o filtro selecionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* GAMES ADMIN TAB */}
        {activeTab === 'admin' && isAdmin && (
          <div className="admin-container">
            {/* Gerenciamento de Catálogo */}

            {/* CRUD Form */}
            <section className="admin-card">
              <h2>{isEditingGame ? 'Editar Jogo' : 'Cadastrar Novo Jogo'}</h2>
              <form onSubmit={handleSaveGame} className="admin-form-grid">
                <div className="form-group">
                  <label htmlFor="gameTitle">Título do Jogo</label>
                  <input 
                    type="text" 
                    id="gameTitle" 
                    className="form-input"
                    value={adminGameForm.title}
                    onChange={handleTitleChange}
                    required
                    autoComplete="off"
                    placeholder="Ex: Flappy Bird"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gameSlug">Slug (Identificador único)</label>
                  <input 
                    type="text" 
                    id="gameSlug" 
                    className="form-input"
                    value={adminGameForm.slug}
                    onChange={(e) => setAdminGameForm({...adminGameForm, slug: e.target.value})}
                    required
                    disabled={isEditingGame}
                    autoComplete="off"
                    placeholder="Ex: flappy-bird"
                  />
                </div>

                <div className="form-group form-full">
                  <label htmlFor="gameDesc">Descrição</label>
                  <textarea 
                    id="gameDesc" 
                    className="form-input"
                    style={{minHeight: '80px', resize: 'vertical'}}
                    value={adminGameForm.description}
                    onChange={(e) => setAdminGameForm({...adminGameForm, description: e.target.value})}
                    placeholder="Breve resumo da jogabilidade ou objetivos..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gameImage">URL da Imagem de Capa</label>
                  <input 
                    type="url" 
                    id="gameImage" 
                    className="form-input"
                    value={adminGameForm.imageUrl}
                    onChange={(e) => setAdminGameForm({...adminGameForm, imageUrl: e.target.value})}
                    placeholder="https://exemplo.com/capa.jpg"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gameLaunch">Launch URL (Endereço do Jogo no Vercel)</label>
                  <input 
                    type="url" 
                    id="gameLaunch" 
                    className="form-input"
                    value={adminGameForm.launchUrl}
                    onChange={(e) => setAdminGameForm({...adminGameForm, launchUrl: e.target.value})}
                    placeholder="https://seu-jogo.vercel.app/"
                  />
                </div>

                <div className="form-group form-full" style={{flexDirection: 'row', gap: '24px'}}>
                  <label className="checkbox-group">
                    <input 
                      type="checkbox" 
                      className="checkbox-input"
                      checked={adminGameForm.embed}
                      onChange={(e) => setAdminGameForm({...adminGameForm, embed: e.target.checked})}
                    />
                    Permitir Rodar em Iframe (Embed)
                  </label>

                  <label className="checkbox-group">
                    <input 
                      type="checkbox" 
                      className="checkbox-input"
                      checked={adminGameForm.isActive}
                      onChange={(e) => setAdminGameForm({...adminGameForm, isActive: e.target.checked})}
                    />
                    Ativo
                  </label>
                </div>

                <div className="form-full admin-actions">
                  {isEditingGame && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsEditingGame(false);
                        setAdminGameForm({
                          id: null,
                          slug: '',
                          title: '',
                          description: '',
                          imageUrl: '',
                          launchUrl: '',
                          embed: true,
                          isActive: true
                        });
                      }} 
                      className="btn btn-secondary"
                    >
                      Cancelar
                    </button>
                  )}
                  <button type="submit" className="btn btn-primary">
                    Salvar Jogo
                  </button>
                </div>
              </form>
            </section>

            {/* List of games */}
            <section className="admin-card">
              <h2>Jogos Cadastrados</h2>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th style={{width: '60px'}}>ID</th>
                      <th>Título</th>
                      <th>Slug</th>
                      <th>URL do Vercel / Servidor</th>
                      <th>Exibição</th>
                      <th style={{width: '120px', textAlign: 'right'}}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {games.length > 0 ? (
                      games.map((g) => (
                        <tr key={g.id}>
                          <td>{g.id}</td>
                          <td style={{fontWeight: 600}}>{g.title}</td>
                          <td><code>{g.slug}</code></td>
                          <td style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>
                            {g.config?.launchUrl || 'Nenhum'}
                          </td>
                          <td>
                            <span className="tag">
                              {g.config?.embed ? 'Iframe (Embed)' : 'Aba Externa'}
                            </span>
                          </td>
                          <td style={{textAlign: 'right'}}>
                            <div className="actions-cell" style={{justifyContent: 'flex-end'}}>
                              <button 
                                onClick={() => handleEditClick(g)}
                                className="action-btn action-edit"
                                title="Editar configurações"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteGame(g.id)}
                                className="action-btn action-delete"
                                title="Remover jogo"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="empty-state">Nenhum jogo cadastrado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* LOGIN POPUP MODAL */}
      {showLoginModal && (
        <div className="auth-container" style={{position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)'}}>
          <div className="login-card">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2>Entrar no Nexus</h2>
              <button 
                onClick={() => setShowLoginModal(false)}
                style={{background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'}}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label htmlFor="loginEmail">E-mail</label>
                <input 
                  type="email" 
                  id="loginEmail" 
                  className="form-input"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  required
                  placeholder="admin@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="loginPassword">Senha</label>
                <input 
                  type="password" 
                  id="loginPassword" 
                  className="form-input"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  required
                  placeholder="Sua senha"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '10px'}}>
                Entrar
              </button>
            </form>

            <p className="login-seed-hint">
              <strong>Seed Padrão:</strong><br />
              Admin: <code>admin@example.com</code> / <code>password1</code>
            </p>
          </div>
        </div>
      )}

      {/* Real-time score notification toast */}
      {realTimeAlert && (
        <div className="realtime-toast">
          <Trophy className="realtime-toast-icon" size={24} />
          <div className="realtime-toast-content">
            <span className="realtime-toast-title">Novo Recorde no Nexus!</span>
            <span className="realtime-toast-desc">
              <strong>{realTimeAlert.userName}</strong> marcou <strong>{realTimeAlert.value.toLocaleString()} pts</strong> em {realTimeAlert.gameTitle}!
            </span>
          </div>
          <button className="realtime-toast-close" onClick={() => setRealTimeAlert(null)}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
