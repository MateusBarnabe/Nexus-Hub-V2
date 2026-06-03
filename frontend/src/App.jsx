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
  Menu,
  Heart,
  MessageSquare,
  PlusSquare
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
  const [isScorePanelOpen, setIsScorePanelOpen] = useState(false);
  const [activeAdminModal, setActiveAdminModal] = useState(null); // null, 'add', 'edit', 'delete'
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
  const isScorePanelOpenRef = useRef(isScorePanelOpen);

  useEffect(() => {
    isScorePanelOpenRef.current = isScorePanelOpen;
  }, [isScorePanelOpen]);

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
            
            // 1. Trigger automatic refresh of leaderboard data via ref if panel is open
            if (isScorePanelOpenRef.current) {
              loadLeaderboardRef.current();
            }
            
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

  // Reload leaderboard whenever filters change or score panel is open
  useEffect(() => {
    if (isScorePanelOpen) {
      loadLeaderboard();
    }
  }, [isScorePanelOpen, filterPeriod, filterGameId]);

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
        setActiveAdminModal(null);
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
        setActiveAdminModal(null);
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

  const handleHomeClick = () => {
    setIsScorePanelOpen(false);
    setActiveAdminModal(null);
  };

  const handleScoreClick = () => {
    setIsScorePanelOpen(!isScorePanelOpen);
  };

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
            className={`nav-item ${(!isScorePanelOpen && !activeAdminModal) ? 'active' : ''}`}
            onClick={handleHomeClick}
            title="Início"
          >
            <Home size={24} />
          </button>
          
          <button 
            className={`nav-item ${isScorePanelOpen ? 'active' : ''}`}
            onClick={handleScoreClick}
            title="Score"
          >
            <Heart size={24} />
          </button>
          
          <div className="notif-wrapper">
            <button 
              className="nav-item" 
              title="Mensagens" 
              onClick={() => setAlert({ type: 'info', message: 'Você não possui novas mensagens.' })}
            >
              <MessageSquare size={24} />
            </button>
            <span className="badge"></span>
          </div>

          {isAdmin && (
            <>
              <button 
                className={`nav-item ${activeAdminModal === 'add' ? 'active' : ''}`}
                onClick={() => { setActiveAdminModal('add'); setIsScorePanelOpen(false); }}
                title="Adicionar Jogo"
              >
                <PlusSquare size={24} />
              </button>
              <button 
                className={`nav-item ${activeAdminModal === 'edit' ? 'active' : ''}`}
                onClick={() => { setActiveAdminModal('edit'); setIsScorePanelOpen(false); }}
                title="Editar Jogo"
              >
                <Edit3 size={24} />
              </button>
              <button 
                className={`nav-item ${activeAdminModal === 'delete' ? 'active' : ''}`}
                onClick={() => { setActiveAdminModal('delete'); setIsScorePanelOpen(false); }}
                title="Remover Jogo"
              >
                <Trash2 size={24} />
              </button>
            </>
          )}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="content">
        
        {/* Dynamic header matching boilerplate top-bar */}
        <header className="top-bar">
          <div className="brand">
            <h1>Nexus Hub</h1>
            <p>JOGOS DISPONÍVEIS</p>
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
              <span>Clique para fazer login</span>
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

        {/* Games Grid (Always displayed as main view) */}
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

            return displayGames.map((game, index) => {
              const isComingSoon = game.isComingSoon;
              const gameImage = getGameImage(game);
              const cardClass = isComingSoon ? 'game-card coming-soon' : (index === 0 ? 'game-card item-1' : 'game-card coming-soon');

              return (
                <article 
                  key={game.id} 
                  className={cardClass}
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
                      <span>{isComingSoon ? 'Em Breve' : (game.config?.category || 'Arcade')}</span>
                      {!isComingSoon && <span>{game.config?.difficulty || 'Normal'}</span>}
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
                      className="btn btn-primary"
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
                      Jogar em Nova Aba
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
      </main>

      {/* LEADERBOARD DRAWER (SLIDE-OUT PANEL) */}
      <aside className={`fnx-score-panel ${isScorePanelOpen ? 'is-open' : ''}`}>
        <div className="fnx-row" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 0 }}>
          <h3 style={{ margin: 0 }}>Leaderboard</h3>
          <button className="fnx-btn" type="button" onClick={() => setIsScorePanelOpen(false)}>Fechar</button>
        </div>
        <div className="fnx-row" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <select 
            className="fnx-input" 
            value={filterPeriod} 
            onChange={(e) => setFilterPeriod(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="all">Sempre (All Time)</option>
            <option value="week">Esta Semana</option>
            <option value="day">Hoje</option>
          </select>
          <select
            className="fnx-input"
            value={filterGameId}
            onChange={(e) => setFilterGameId(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">Todos os Jogos</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>{g.title}</option>
            ))}
          </select>
        </div>
        
        <ul className="fnx-score-list" style={{ marginTop: '15px' }}>
          {leaderboard.length > 0 ? (
            leaderboard.map((entry, idx) => (
              <li key={entry.user?.id || idx} className="fnx-score-item">
                <span className="fnx-score-rank">#{entry.rank}</span>
                <span>{entry.user?.name || 'Desconhecido'}</span>
                <span className="fnx-score-points">{entry.totalScore.toLocaleString()}</span>
              </li>
            ))
          ) : (
            <li className="fnx-score-item">
              <span>-</span>
              <span>Nenhum registro</span>
              <span>0</span>
            </li>
          )}
        </ul>
      </aside>

      {/* ADMIN OVERLAY MODALS */}
      {activeAdminModal && (
        <div className="fnx-overlay is-open" onClick={(e) => e.target.classList.contains('fnx-overlay') && setActiveAdminModal(null)}>
          <div className="fnx-modal">
            {activeAdminModal === 'add' && (
              <>
                <h3 style={{ marginBottom: '15px' }}>Adicionar jogo</h3>
                <form onSubmit={handleSaveGame}>
                  <div className="form-group">
                    <label>Slug</label>
                    <input 
                      type="text" 
                      className="fnx-input" 
                      required 
                      placeholder="meu-jogo" 
                      value={adminGameForm.slug}
                      onChange={(e) => setAdminGameForm({...adminGameForm, slug: e.target.value})}
                    />
                  </div>
                  <div className="form-group" style={{ marginTop: '10px' }}>
                    <label>Título</label>
                    <input 
                      type="text" 
                      className="fnx-input" 
                      required 
                      placeholder="Meu Jogo" 
                      value={adminGameForm.title}
                      onChange={handleTitleChange}
                    />
                  </div>
                  <div className="form-group" style={{ marginTop: '10px' }}>
                    <label>Descrição</label>
                    <input 
                      type="text" 
                      className="fnx-input" 
                      placeholder="Descrição curta" 
                      value={adminGameForm.description}
                      onChange={(e) => setAdminGameForm({...adminGameForm, description: e.target.value})}
                    />
                  </div>
                  <div className="form-group" style={{ marginTop: '10px' }}>
                    <label>Imagem URL</label>
                    <input 
                      type="text" 
                      className="fnx-input" 
                      placeholder="https://..." 
                      value={adminGameForm.imageUrl}
                      onChange={(e) => setAdminGameForm({...adminGameForm, imageUrl: e.target.value})}
                    />
                  </div>
                  <div className="form-group" style={{ marginTop: '10px' }}>
                    <label>Launch URL</label>
                    <input 
                      type="text" 
                      className="fnx-input" 
                      placeholder="https://..." 
                      value={adminGameForm.launchUrl}
                      onChange={(e) => setAdminGameForm({...adminGameForm, launchUrl: e.target.value})}
                    />
                  </div>
                  <div className="fnx-row" style={{ marginTop: '15px' }}>
                    <button type="submit" className="fnx-btn fnx-btn-primary">Salvar</button>
                    <button type="button" className="fnx-btn" onClick={() => setActiveAdminModal(null)}>Cancelar</button>
                  </div>
                </form>
              </>
            )}

            {activeAdminModal === 'edit' && (
              <>
                <h3 style={{ marginBottom: '10px' }}>Editar jogo</h3>
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label>Selecione o jogo</label>
                  <select 
                    className="fnx-input" 
                    value={adminGameForm.id || ''}
                    onChange={(e) => {
                      const selected = games.find(g => Number(g.id) === Number(e.target.value));
                      if (selected) {
                        setIsEditingGame(true);
                        setAdminGameForm({
                          id: selected.id,
                          slug: selected.slug || '',
                          title: selected.title || '',
                          description: selected.description || '',
                          imageUrl: selected.imageUrl || '',
                          launchUrl: selected.config?.launchUrl || '',
                          embed: selected.config?.embed ?? true,
                          isActive: selected.isActive ?? true
                        });
                      }
                    }}
                  >
                    <option value="">Selecione...</option>
                    {games.map((g) => (
                      <option key={g.id} value={g.id}>{g.title}</option>
                    ))}
                  </select>
                </div>
                
                {adminGameForm.id && (
                  <form onSubmit={handleSaveGame}>
                    <div className="form-group">
                      <label>Slug</label>
                      <input 
                        type="text" 
                        className="fnx-input" 
                        value={adminGameForm.slug} 
                        disabled 
                      />
                    </div>
                    <div className="form-group" style={{ marginTop: '10px' }}>
                      <label>Título</label>
                      <input 
                        type="text" 
                        className="fnx-input" 
                        required 
                        value={adminGameForm.title}
                        onChange={(e) => setAdminGameForm({...adminGameForm, title: e.target.value})}
                      />
                    </div>
                    <div className="form-group" style={{ marginTop: '10px' }}>
                      <label>Descrição</label>
                      <input 
                        type="text" 
                        className="fnx-input" 
                        value={adminGameForm.description}
                        onChange={(e) => setAdminGameForm({...adminGameForm, description: e.target.value})}
                      />
                    </div>
                    <div className="form-group" style={{ marginTop: '10px' }}>
                      <label>Imagem URL</label>
                      <input 
                        type="text" 
                        className="fnx-input" 
                        value={adminGameForm.imageUrl}
                        onChange={(e) => setAdminGameForm({...adminGameForm, imageUrl: e.target.value})}
                      />
                    </div>
                    <div className="form-group" style={{ marginTop: '10px' }}>
                      <label>Launch URL</label>
                      <input 
                        type="text" 
                        className="fnx-input" 
                        value={adminGameForm.launchUrl}
                        onChange={(e) => setAdminGameForm({...adminGameForm, launchUrl: e.target.value})}
                      />
                    </div>
                    <div className="fnx-row" style={{ marginTop: '15px' }}>
                      <button type="submit" className="fnx-btn fnx-btn-primary">Salvar alterações</button>
                      <button type="button" className="fnx-btn" onClick={() => setActiveAdminModal(null)}>Cancelar</button>
                    </div>
                  </form>
                )}
              </>
            )}

            {activeAdminModal === 'delete' && (
              <>
                <h3 style={{ marginBottom: '10px' }}>Remover jogo</h3>
                <p style={{ opacity: 0.9, margin: 0, marginBottom: '15px' }}>Selecione um jogo cadastrado para remover.</p>
                <ul className="fnx-list">
                  {games.length > 0 ? (
                    games.map((g) => (
                      <li key={g.id} className="fnx-list-item">
                        <span>{g.title}</span>
                        <button 
                          type="button" 
                          className="fnx-btn" 
                          style={{ background: 'var(--color-danger)', borderColor: 'transparent' }}
                          onClick={() => handleDeleteGame(g.id)}
                        >
                          Remover
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="fnx-list-item">
                      <span>Nenhum jogo ativo para remover.</span>
                    </li>
                  )}
                </ul>
                <div className="fnx-row" style={{ marginTop: '15px' }}>
                  <button type="button" className="fnx-btn" onClick={() => setActiveAdminModal(null)}>Fechar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* LOGIN POPUP MODAL (styled as boilerplate fnx-modal) */}
      {showLoginModal && (
        <div className="fnx-overlay is-open" onClick={(e) => e.target.classList.contains('fnx-overlay') && setShowLoginModal(false)}>
          <div className="fnx-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Entrar no Nexus</h3>
              <button 
                onClick={() => setShowLoginModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label>E-mail</label>
                <input 
                  type="email" 
                  className="fnx-input"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  required
                  placeholder="admin@example.com"
                />
              </div>

              <div className="form-group" style={{ marginTop: '10px' }}>
                <label>Senha</label>
                <input 
                  type="password" 
                  className="fnx-input"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  required
                  placeholder="Sua senha"
                />
              </div>

              <button type="submit" className="fnx-btn fnx-btn-primary" style={{ width: '100%', marginTop: '15px' }}>
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
