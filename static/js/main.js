// --- START OF FILE /static/js/main.js (v1.0.7 - Sistema de Temporadas) ---

// Pokémon TCG Pocket Rank Tracker
// Versión: 1.0.7

const RANKS = [ { name: "Beginner Rank #1", points: 0, winPoints: 10, lossPoints: 0 }, { name: "Beginner Rank #2", points: 20, winPoints: 10, lossPoints: 0 }, { name: "Beginner Rank #3", points: 50, winPoints: 10, lossPoints: 0 }, { name: "Beginner Rank #4", points: 95, winPoints: 10, lossPoints: 0 }, { name: "Poké Ball Rank #1", points: 145, winPoints: 10, lossPoints: 5 }, { name: "Poké Ball Rank #2", points: 195, winPoints: 10, lossPoints: 5 }, { name: "Poké Ball Rank #3", points: 245, winPoints: 10, lossPoints: 5 }, { name: "Poké Ball Rank #4", points: 300, winPoints: 10, lossPoints: 5 }, { name: "Great Ball Rank #1", points: 355, winPoints: 10, lossPoints: 5 }, { name: "Great Ball Rank #2", points: 420, winPoints: 10, lossPoints: 5 }, { name: "Great Ball Rank #3", points: 490, winPoints: 10, lossPoints: 5 }, { name: "Great Ball Rank #4", points: 600, winPoints: 10, lossPoints: 5 }, { name: "Ultra Ball Rank #1", points: 710, winPoints: 10, lossPoints: 7 }, { name: "Ultra Ball Rank #2", points: 860, winPoints: 10, lossPoints: 7 }, { name: "Ultra Ball Rank #3", points: 1010, winPoints: 10, lossPoints: 7 }, { name: "Ultra Ball Rank #4", points: 1225, winPoints: 10, lossPoints: 7 }, { name: "Master Ball Rank", points: 1450, winPoints: 10, lossPoints: 10 } ];
const WIN_STREAK_BONUS = [0, 3, 6, 9, 12];
const APP_NAME = 'pokemon-tcg-rank-tracker';
const IDB_KEY = 'userData';
const DATA_VERSION = '1.3'; // Nueva versión de datos por sistema de temporadas
const APP_CONFIG = { version: '1.0.7', dataVersion: DATA_VERSION };

// Tabla de descenso de rango oficial entre temporadas
const RANK_DEMOTION_TABLE = [
  // Beginner Ranks - No cambian
  { fromRank: 0, toRank: 0 }, // Beginner Rank #1 → Beginner Rank #1
  { fromRank: 1, toRank: 1 }, // Beginner Rank #2 → Beginner Rank #2
  { fromRank: 2, toRank: 2 }, // Beginner Rank #3 → Beginner Rank #3
  { fromRank: 3, toRank: 3 }, // Beginner Rank #4 → Beginner Rank #4
  
  // Poké Ball Ranks - No cambian
  { fromRank: 4, toRank: 4 }, // Poké Ball Rank #1 → Poké Ball Rank #1
  { fromRank: 5, toRank: 5 }, // Poké Ball Rank #2 → Poké Ball Rank #2
  { fromRank: 6, toRank: 6 }, // Poké Ball Rank #3 → Poké Ball Rank #3
  { fromRank: 7, toRank: 7 }, // Poké Ball Rank #4 → Poké Ball Rank #4
  
  // Great Ball Ranks - Great Ball #1 no cambia, el resto desciende
  { fromRank: 8, toRank: 8 }, // Great Ball Rank #1 → Great Ball Rank #1
  { fromRank: 9, toRank: 8 }, // Great Ball Rank #2 → Great Ball Rank #1
  { fromRank: 10, toRank: 9 }, // Great Ball Rank #3 → Great Ball Rank #2
  { fromRank: 11, toRank: 9 }, // Great Ball Rank #4 → Great Ball Rank #2
  
  // Ultra Ball Ranks - Todos descienden
  { fromRank: 12, toRank: 10 }, // Ultra Ball Rank #1 → Great Ball Rank #3
  { fromRank: 13, toRank: 11 }, // Ultra Ball Rank #2 → Great Ball Rank #4
  { fromRank: 14, toRank: 12 }, // Ultra Ball Rank #3 → Ultra Ball Rank #1
  { fromRank: 15, toRank: 13 }, // Ultra Ball Rank #4 → Ultra Ball Rank #2
  
  // Master Ball Rank - Desciende
  { fromRank: 16, toRank: 14 }, // Master Ball Rank → Ultra Ball Rank #3
];

const PokemonTCGRankTracker = () => {
  // Estados estándar (ahora reflejan la temporada actual)
  const [view, setView] = React.useState('setup');
  const [points, setPoints] = React.useState(0);
  const [wins, setWins] = React.useState(0);
  const [losses, setLosses] = React.useState(0);
  const [currentRank, setCurrentRank] = React.useState(0);
  const [winStreak, setWinStreak] = React.useState(0);
  const [gameHistory, setGameHistory] = React.useState([]);
  const [rankHistory, setRankHistory] = React.useState({});
  const [setupPoints, setSetupPoints] = React.useState('0');
  const [setupWins, setSetupWins] = React.useState('0');
  const [setupLosses, setSetupLosses] = React.useState('0');
  const [setupWinStreak, setSetupWinStreak] = React.useState('0');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');
  const [importText, setImportText] = React.useState('');
  const [showImportDialog, setShowImportDialog] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState('');
  const [dbReady, setDbReady] = React.useState(false);
  const [installPrompt, setInstallPrompt] = React.useState(null);
  const [isStandalone, setIsStandalone] = React.useState(false);
  const [currentDeckName, setCurrentDeckName] = React.useState('');
  const [deckStats, setDeckStats] = React.useState({});
  
  // *** NUEVOS ESTADOS PARA TEMPORADAS ***
  const [seasons, setSeasons] = React.useState([]); // Lista de temporadas pasadas
  const [currentSeason, setCurrentSeason] = React.useState({ // Temporada actual
    id: "season1", 
    name: "Temporada 1",
    startDate: new Date().toISOString(),
  });
  const [showSeasonsDialog, setShowSeasonsDialog] = React.useState(false); // Dialog para ver temporadas
  const [showNewSeasonDialog, setShowNewSeasonDialog] = React.useState(false); // Dialog para nueva temporada
  const [newSeasonName, setNewSeasonName] = React.useState(''); // Nombre de la nueva temporada
  const [selectedSeason, setSelectedSeason] = React.useState(null); // Temporada seleccionada para ver
  const [seasonViewMode, setSeasonViewMode] = React.useState(false); // Si estamos viendo una temporada pasada
  const [newSeasonMode, setNewSeasonMode] = React.useState('official'); // Modo de inicio de temporada: 'official' o 'custom'
  const [customRankIndex, setCustomRankIndex] = React.useState(0); // Índice de rango personalizado para nueva temporada
  const [customPoints, setCustomPoints] = React.useState('0'); // Puntos personalizados para nueva temporada

  const initRankHistory = React.useCallback(() => {
    const newRankHistory = {};
    RANKS.forEach((rank, index) => { newRankHistory[index] = { wins: 0, losses: 0 }; });
    return newRankHistory;
  }, []);

  React.useEffect(() => { /* PWA Install Prompt + Standalone check */
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setInstallPrompt(e); });
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => setIsStandalone(e.matches));
  }, []);

  React.useEffect(() => { /* Init DB */
    const initDatabase = async () => {
      try {
        if (!window.indexedDB) { console.warn("IndexedDB no soportado, usando localStorage."); setDbReady(true); return; }
        const dbRequest = indexedDB.open(APP_NAME, 1);
        dbRequest.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('userData')) { db.createObjectStore('userData', { keyPath: 'id' }); console.log("Object store creado."); }
        };
        dbRequest.onsuccess = () => { console.log("IndexedDB OK."); setDbReady(true); };
        dbRequest.onerror = (event) => { console.error("Error IndexedDB init:", event.target.error); setDbReady(true); };
      } catch (error) { console.error("Error crítico IndexedDB:", error); setDbReady(true); }
    };
    initDatabase();
  }, []);

  const loadFromStorage = React.useCallback(async () => {
    try {
      if (window.indexedDB) {
        return new Promise((resolve, reject) => {
          const dbRequest = indexedDB.open(APP_NAME, 1);
          dbRequest.onsuccess = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('userData')) { resolve(null); return; }
            const transaction = db.transaction(['userData'], 'readonly');
            const objectStore = transaction.objectStore('userData');
            const request = objectStore.get(IDB_KEY);
            request.onsuccess = () => resolve(request.result ? request.result.data : null);
            request.onerror = (event) => { console.error("Error leyendo IDB:", event.target.error); reject(event.target.error); };
          };
          dbRequest.onerror = (event) => { console.error("Error abriendo IDB lectura:", event.target.error); reject(event.target.error); };
        });
      }
    } catch (error) { console.warn("Error IDB carga, fallback localStorage:", error); }
    const savedData = localStorage.getItem(`${APP_NAME}-data`);
    return savedData ? JSON.parse(savedData) : null;
  }, []);

  const saveToStorage = React.useCallback(async (data) => {
    try {
      if (window.indexedDB) {
        return new Promise((resolve, reject) => {
          const dbRequest = indexedDB.open(APP_NAME, 1);
          dbRequest.onsuccess = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('userData')) { console.error("Store no encontrado al guardar."); reject(new Error("Object store no existe")); return; }
            const transaction = db.transaction(['userData'], 'readwrite');
            const objectStore = transaction.objectStore('userData');
            const record = { id: IDB_KEY, data: data, timestamp: new Date().toISOString() };
            const request = objectStore.put(record);
            request.onsuccess = () => resolve(true);
            request.onerror = (event) => { console.error("Error escribiendo IDB:", event.target.error); reject(event.target.error); };
          };
          dbRequest.onerror = (event) => { console.error("Error abriendo IDB escritura:", event.target.error); reject(event.target.error); };
        });
      }
    } catch (error) { console.warn("Error IDB guardado, fallback localStorage:", error); }
    try {
      localStorage.setItem(`${APP_NAME}-data`, JSON.stringify(data));
      return true;
    } catch (storageError) { console.error("Error guardando localStorage:", storageError); setErrorMessage("Error crítico: No se pudieron guardar los datos."); return false; }
  }, []); // setErrorMessage es estable

  // *** FUNCIÓN PARA MIGRAR DATOS EXISTENTES AL NUEVO FORMATO ***
  const migrateDataToSeasons = React.useCallback((data) => {
    if (!data) return null;
    
    // Si ya tiene estructura de temporadas, devolvemos tal cual
    if (data.currentSeason && Array.isArray(data.seasons)) {
      console.log("Datos ya en formato de temporadas");
      return data;
    }
    
    // Migrar al nuevo formato
    console.log("Migrando datos al formato de temporadas");
    return {
      currentSeason: {
        id: "season1",
        name: "Temporada 1",
        startDate: data.lastUpdated || new Date().toISOString(),
        points: data.points || 0,
        wins: data.wins || 0,
        losses: data.losses || 0,
        winStreak: data.winStreak || 0,
        gameHistory: data.gameHistory || [],
        rankHistory: data.rankHistory || {},
        deckStats: data.deckStats || {},
        currentDeckName: data.currentDeckName || '',
        lastUpdated: data.lastUpdated || new Date().toISOString()
      },
      seasons: [],
      autoload: data.autoload !== undefined ? data.autoload : true,
      version: DATA_VERSION,
      appVersion: APP_CONFIG.version,
      lastUpdated: new Date().toISOString()
    };
  }, []);

  React.useEffect(() => { /* Load Data on DB Ready */
    if (!dbReady) return;
    const loadInitialData = async () => {
      try {
        const data = await loadFromStorage();
        if (data) {
          if (data.version && data.version !== DATA_VERSION) {
            console.warn(`Versión de datos ${data.version} != ${DATA_VERSION}. Migrando...`);
          }
          
          // *** MIGRAR DATOS AL FORMATO DE TEMPORADAS SI ES NECESARIO ***
          const migratedData = migrateDataToSeasons(data);
          
          setSetupPoints(migratedData.currentSeason?.points?.toString() || '0');
          setSetupWins(migratedData.currentSeason?.wins?.toString() || '0');
          setSetupLosses(migratedData.currentSeason?.losses?.toString() || '0');
          setSetupWinStreak(migratedData.currentSeason?.winStreak?.toString() || '0');
          
          // Guardar información de temporadas
          setCurrentSeason(migratedData.currentSeason || {
            id: "season1",
            name: "Temporada 1",
            startDate: new Date().toISOString()
          });
          setSeasons(migratedData.seasons || []);
          
          if (migratedData.autoload) {
            // Cargar datos de la temporada actual
            setPoints(migratedData.currentSeason?.points || 0);
            setWins(migratedData.currentSeason?.wins || 0);
            setLosses(migratedData.currentSeason?.losses || 0);
            setWinStreak(migratedData.currentSeason?.winStreak || 0);
            setGameHistory(migratedData.currentSeason?.gameHistory || []);
            
            const loadedRankHistory = migratedData.currentSeason?.rankHistory || {};
            const initializedRankHistory = initRankHistory();
            Object.keys(initializedRankHistory).forEach(rankIdx => { 
              if (loadedRankHistory[rankIdx]) { 
                initializedRankHistory[rankIdx].wins = loadedRankHistory[rankIdx].wins || 0; 
                initializedRankHistory[rankIdx].losses = loadedRankHistory[rankIdx].losses || 0; 
              } 
            });
            setRankHistory(initializedRankHistory);
            
            setDeckStats(migratedData.currentSeason?.deckStats || {});
            setCurrentDeckName(migratedData.currentSeason?.currentDeckName || '');
            
            // Si los datos se migraron, guardarlos de inmediato con el nuevo formato
            if (data.version !== DATA_VERSION) {
              saveToStorage(migratedData);
            }
            
            setView('main');
          } else {
            setRankHistory(initRankHistory());
            setDeckStats({});
            setCurrentDeckName('');
          }
        } else {
          setRankHistory(initRankHistory());
          setDeckStats({});
          setCurrentDeckName('');
          setCurrentSeason({
            id: "season1",
            name: "Temporada 1",
            startDate: new Date().toISOString()
          });
          setSeasons([]);
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
        setErrorMessage('Error cargando datos guardados');
        setRankHistory(initRankHistory());
        setDeckStats({});
        setCurrentDeckName('');
        setCurrentSeason({
          id: "season1",
          name: "Temporada 1",
          startDate: new Date().toISOString()
        });
        setSeasons([]);
      }
    };
    loadInitialData();
  }, [dbReady, loadFromStorage, initRankHistory, migrateDataToSeasons, saveToStorage]);

  React.useEffect(() => { /* Save Data on Change */
    if (view === 'main' && dbReady && !seasonViewMode) {
      // Solo guardar cuando estamos en la vista principal y no en modo visualización
      const currentSeasonData = {
        ...currentSeason,
        points,
        wins, 
        losses,
        winStreak,
        gameHistory,
        rankHistory,
        deckStats,
        currentDeckName,
        lastUpdated: new Date().toISOString()
      };
      
      const dataToSave = {
        currentSeason: currentSeasonData,
        seasons,
        autoload: true,
        lastUpdated: new Date().toISOString(),
        version: DATA_VERSION,
        appVersion: APP_CONFIG.version
      };
      
      saveToStorage(dataToSave).catch(error => { 
        setErrorMessage('Hubo un problema al guardar los datos.'); 
      });
    }
  }, [
    points, wins, losses, winStreak, gameHistory, rankHistory, 
    deckStats, currentDeckName, currentSeason, seasons,
    view, dbReady, seasonViewMode, saveToStorage
  ]);

  React.useEffect(() => { /* Calculate Current Rank */
    let rank = 0;
    for (let i = RANKS.length - 1; i >= 0; i--) { if (points >= RANKS[i].points) { rank = i; break; } }
    setCurrentRank(rank);
  }, [points]);

  React.useEffect(() => { /* Lucide Icons Update */
     if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
       try { lucide.createIcons(); } catch (error) { console.error("Error lucide.createIcons:", error); }
     } else { console.warn("Lucide no listo."); }
  }, [view, showImportDialog, showSeasonsDialog, showNewSeasonDialog]);

  // --- Funciones de Cálculo ---
  const calculateWinRate = React.useCallback((w, l) => {
    const total = w + l;
    return total > 0 ? ((w / total) * 100).toFixed(1) : '0.0';
  }, []);

  const calculateGamesToMasterBall = React.useCallback(() => {
    try { 
      if (currentRank >= 16) return 0; 
      const targetPoints = RANKS[16].points; 
      if (points >= targetPoints) return 0; 
      const globalWinRate = (wins + losses > 0) ? wins / (wins + losses) : 0.5; 
      let estimatedTotalGames = 0; 
      let currentSimulatedPoints = points; 
      
      for (let i = currentRank; i < 16; i++) { 
        const rankData = RANKS[i]; 
        const nextRankPoints = (i + 1 < RANKS.length) ? RANKS[i+1].points : targetPoints; 
        const pointsNeededForThisRank = nextRankPoints - currentSimulatedPoints; 
        if (pointsNeededForThisRank <= 0) { 
          currentSimulatedPoints = Math.max(currentSimulatedPoints, rankData.points); 
          continue; 
        } 
        const winPoints = rankData.winPoints; 
        const lossPoints = rankData.lossPoints; 
        
        // Sistema de rachas extendido - ahora aplica a todos los rangos
        let avgStreakBonus = 0; 
        if (globalWinRate > 0.8) avgStreakBonus = 9; 
        else if (globalWinRate > 0.65) avgStreakBonus = 6; 
        else if (globalWinRate > 0.5) avgStreakBonus = 3; 
        
        const effectiveWinPoints = winPoints + avgStreakBonus; 
        const netPointsPerGame = (globalWinRate * effectiveWinPoints) - ((1 - globalWinRate) * lossPoints); 
        if (netPointsPerGame <= 0) return Infinity; 
        const gamesForThisRank = Math.ceil(pointsNeededForThisRank / netPointsPerGame); 
        estimatedTotalGames += gamesForThisRank; 
        currentSimulatedPoints += pointsNeededForThisRank; 
      } 
      return estimatedTotalGames; 
    } catch (error) { 
      console.error('Error calculando juegos hasta Master Ball:', error); 
      return Infinity; 
    }
  }, [currentRank, points, wins, losses]);

  const calculateRankProjection = React.useCallback((rankIndex) => {
      try { 
        const rank = RANKS[rankIndex]; 
        const nextRankIndex = rankIndex + 1; 
        if (nextRankIndex >= RANKS.length) return "¡Rango máximo!"; 
        const nextRank = RANKS[nextRankIndex]; 
        let pointsNeeded; 
        if (rankIndex === currentRank && currentRank < 16) { 
          pointsNeeded = nextRank.points - points; 
        } else if (rankIndex < currentRank) { 
          return "-"; 
        } else { 
          pointsNeeded = nextRank.points - rank.points; 
        } 
        if (pointsNeeded <=0) return "Completado"; 
        const rankStats = rankHistory[rankIndex] || { wins: 0, losses: 0 }; 
        const totalGamesInRank = rankStats.wins + rankStats.losses; 
        let rankWinRate; 
        if (totalGamesInRank > 0) { 
          rankWinRate = rankStats.wins / totalGamesInRank; 
        } else if (wins + losses > 0) { 
          rankWinRate = wins / (wins + losses); 
        } else { 
          rankWinRate = 0.5; 
        } 
        const winPoints = rank.winPoints; 
        const lossPoints = rank.lossPoints; 
        
        // Sistema de rachas extendido - ahora aplica a todos los rangos incluido Master Ball
        let avgStreakBonus = 0; 
        if (rankWinRate > 0.8) avgStreakBonus = 9; 
        else if (rankWinRate > 0.65) avgStreakBonus = 6; 
        else if (rankWinRate > 0.5) avgStreakBonus = 3; 
        
        const effectiveWinPoints = winPoints + avgStreakBonus; 
        const netPointsPerGame = (rankWinRate * effectiveWinPoints) - ((1 - rankWinRate) * lossPoints); 
        if (netPointsPerGame <= 0) { 
          const requiredWinRate = (lossPoints / (winPoints + lossPoints)); 
          return `${pointsNeeded} pts | Req: >${(requiredWinRate * 100).toFixed(0)}% WR`; 
        } 
        const estimatedGames = Math.ceil(pointsNeeded / netPointsPerGame); 
        return `${pointsNeeded} pts | ~${estimatedGames} partidas`; 
      } catch (error) { 
        console.error('Error proyección rango:', error); 
        return "Error"; 
      }
  }, [points, wins, losses, currentRank, rankHistory]);

  // --- Funciones de Acción ---
  
  const formatDate = React.useCallback((dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Fecha desconocida';
    }
  }, []);
  
  // Función para obtener el nuevo rango según el sistema oficial
  const getNewSeasonRank = React.useCallback((currentRankIndex, currentPoints) => {
    // Caso especial para Master Ball con muchos puntos (1675+)
    if (currentRankIndex === 16 && currentPoints >= 1675) {
      return 15; // Ultra Ball Rank #4
    }
    
    // Caso normal - usar la tabla
    if (currentRankIndex >= 0 && currentRankIndex <= 16) {
      return RANK_DEMOTION_TABLE[currentRankIndex].toRank;
    }
    
    // Si no hay coincidencia, mantener el mismo rango
    return currentRankIndex;
  }, []);
  
  // Función para obtener los puntos iniciales del nuevo rango
  const getInitialPointsForRank = React.useCallback((rankIndex) => {
    if (rankIndex >= 0 && rankIndex < RANKS.length) {
      return RANKS[rankIndex].points;
    }
    return 0;
  }, []);
  
  // *** FUNCIÓN PARA INICIAR NUEVA TEMPORADA ***
  const startNewSeason = React.useCallback((newName) => {
    try {
      // Verificar que el nombre no esté vacío
      if (!newName || !newName.trim()) {
        setErrorMessage('Por favor ingrese un nombre para la temporada');
        return false;
      }
      
      // Guardar temporada actual en historial
      const currentSeasonData = {
        ...currentSeason,
        points,
        wins,
        losses,
        winStreak,
        gameHistory,
        rankHistory,
        deckStats,
        currentDeckName,
        lastUpdated: new Date().toISOString()
      };
      
      const updatedSeasons = [currentSeasonData, ...seasons];
      
      // Determinar el rango y puntos iniciales para la nueva temporada
      let initialRank, initialPoints;
      
      if (newSeasonMode === 'official') {
        // Usar el sistema oficial de descenso de rangos
        initialRank = getNewSeasonRank(currentRank, points);
        initialPoints = getInitialPointsForRank(initialRank);
      } else {
        // Usar valores personalizados
        initialRank = parseInt(customRankIndex);
        initialPoints = parseInt(customPoints) || getInitialPointsForRank(initialRank);
      }
      
      // Crear nueva temporada
      const newSeasonId = `season${updatedSeasons.length + 1}`;
      const newSeasonData = {
        id: newSeasonId,
        name: newName.trim(),
        startDate: new Date().toISOString(),
        points: initialPoints,
        wins: 0,
        losses: 0,
        winStreak: 0,
        gameHistory: [],
        rankHistory: initRankHistory(),
        deckStats: {},
        currentDeckName: '',
        lastUpdated: new Date().toISOString()
      };
      
      // Actualizar estados
      setSeasons(updatedSeasons);
      setCurrentSeason(newSeasonData);
      
      // Actualizar estados de la UI para la nueva temporada
      setPoints(initialPoints);
      setWins(0);
      setLosses(0);
      setWinStreak(0);
      setGameHistory([]);
      setRankHistory(initRankHistory());
      setDeckStats({});
      setCurrentDeckName('');
      
      // Guardar cambios
      const dataToSave = {
        currentSeason: newSeasonData,
        seasons: updatedSeasons,
        autoload: true,
        lastUpdated: new Date().toISOString(),
        version: DATA_VERSION,
        appVersion: APP_CONFIG.version
      };
      
      saveToStorage(dataToSave);
      
      // Mostrar mensaje de éxito
      let successMsg = `Nueva temporada "${newName.trim()}" iniciada`;
      if (newSeasonMode === 'official') {
        successMsg += ` con descenso oficial a ${RANKS[initialRank].name}`;
      } else {
        successMsg += ` con rango personalizado: ${RANKS[initialRank].name}`;
      }
      
      setSuccessMessage(successMsg);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Limpiar diálogo
      setShowNewSeasonDialog(false);
      setNewSeasonName('');
      setNewSeasonMode('official');
      setCustomRankIndex(0);
      setCustomPoints('0');
      
      return true;
    } catch (error) {
      console.error('Error al iniciar nueva temporada:', error);
      setErrorMessage('Error al iniciar nueva temporada');
      return false;
    }
  }, [
    currentSeason, points, wins, losses, winStreak, 
    gameHistory, rankHistory, deckStats, currentDeckName, 
    seasons, initRankHistory, saveToStorage, currentRank,
    newSeasonMode, customRankIndex, customPoints,
    getNewSeasonRank, getInitialPointsForRank
  ]);
  
  // *** FUNCIÓN PARA CARGAR UNA TEMPORADA PARA VISUALIZACIÓN ***
  const viewSeasonData = React.useCallback((seasonIndex) => {
    try {
      if (seasonIndex < 0 || seasonIndex >= seasons.length) {
        setErrorMessage('Temporada no encontrada');
        return;
      }
      
      const seasonData = seasons[seasonIndex];
      
      // Cargar datos de la temporada seleccionada en la UI
      setPoints(seasonData.points || 0);
      setWins(seasonData.wins || 0);
      setLosses(seasonData.losses || 0);
      setWinStreak(seasonData.winStreak || 0);
      setGameHistory(seasonData.gameHistory || []);
      
      // Inicializar rankHistory correctamente
      const initializedRankHistory = initRankHistory();
      const loadedRankHistory = seasonData.rankHistory || {};
      
      Object.keys(initializedRankHistory).forEach(rankIdx => { 
        if (loadedRankHistory[rankIdx]) { 
          initializedRankHistory[rankIdx].wins = loadedRankHistory[rankIdx].wins || 0; 
          initializedRankHistory[rankIdx].losses = loadedRankHistory[rankIdx].losses || 0; 
        } 
      });
      setRankHistory(initializedRankHistory);
      
      // Establecer datos de mazos
      setDeckStats(seasonData.deckStats || {});
      setCurrentDeckName(seasonData.currentDeckName || '');
      
      // Guardar la temporada seleccionada y activar modo visualización
      setSelectedSeason(seasonData);
      setSeasonViewMode(true);
      
      // Cerrar dialogo de temporadas
      setShowSeasonsDialog(false);
      
      // Mostrar mensaje informativo
      setSuccessMessage(`Visualizando temporada: ${seasonData.name}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error al cargar temporada:', error);
      setErrorMessage('Error al cargar datos de la temporada');
    }
  }, [seasons, initRankHistory]);
  
  // *** FUNCIÓN PARA VOLVER A LA TEMPORADA ACTUAL ***
  const returnToCurrentSeason = React.useCallback(() => {
    try {
      // Cargar datos de la temporada actual
      setPoints(currentSeason.points || 0);
      setWins(currentSeason.wins || 0);
      setLosses(currentSeason.losses || 0);
      setWinStreak(currentSeason.winStreak || 0);
      setGameHistory(currentSeason.gameHistory || []);
      
      // Inicializar rankHistory
      const initializedRankHistory = initRankHistory();
      const loadedRankHistory = currentSeason.rankHistory || {};
      
      Object.keys(initializedRankHistory).forEach(rankIdx => { 
        if (loadedRankHistory[rankIdx]) { 
          initializedRankHistory[rankIdx].wins = loadedRankHistory[rankIdx].wins || 0; 
          initializedRankHistory[rankIdx].losses = loadedRankHistory[rankIdx].losses || 0; 
        } 
      });
      setRankHistory(initializedRankHistory);
      
      // Cargar datos de mazos
      setDeckStats(currentSeason.deckStats || {});
      setCurrentDeckName(currentSeason.currentDeckName || '');
      
      // Desactivar modo visualización y limpiar temporada seleccionada
      setSelectedSeason(null);
      setSeasonViewMode(false);
      
      setSuccessMessage('Volviendo a temporada actual');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error al volver a temporada actual:', error);
      setErrorMessage('Error al cargar temporada actual');
    }
  }, [currentSeason, initRankHistory]);

  const handleSetupSubmit = React.useCallback(() => {
    try {
      const initialPoints = parseInt(setupPoints) || 0;
      const initialWins = parseInt(setupWins) || 0;
      const initialLosses = parseInt(setupLosses) || 0;
      const initialWinStreak = parseInt(setupWinStreak) || 0;
      
      setPoints(initialPoints); 
      setWins(initialWins); 
      setLosses(initialLosses); 
      setWinStreak(initialWinStreak);
      setGameHistory([]);
      
      const newRankHistory = initRankHistory();
      setRankHistory(newRankHistory);
      
      setDeckStats({});
      setCurrentDeckName('');
      
      // Actualizar datos de la temporada actual
      const updatedCurrentSeason = {
        ...currentSeason,
        points: initialPoints,
        wins: initialWins,
        losses: initialLosses,
        winStreak: initialWinStreak,
        gameHistory: [],
        rankHistory: newRankHistory,
        deckStats: {},
        currentDeckName: '',
        lastUpdated: new Date().toISOString()
      };
      
      setCurrentSeason(updatedCurrentSeason);
      
      setView('main');
      setErrorMessage('');
      
      // Guardar con la estructura de temporadas
      const dataToSave = { 
        currentSeason: updatedCurrentSeason,
        seasons,
        autoload: true, 
        lastUpdated: new Date().toISOString(), 
        version: DATA_VERSION, 
        appVersion: APP_CONFIG.version 
      };
      
      saveToStorage(dataToSave).catch(err => console.error("Error guardando en setup:", err));
    } catch (error) { 
      console.error('Error en setup:', error); 
      setErrorMessage('Error en la configuración.'); 
    }
  }, [setupPoints, setupWins, setupLosses, setupWinStreak, initRankHistory, saveToStorage, currentSeason, seasons]);

  // Función para eliminar la última partida
  const deleteLastGame = React.useCallback(() => {
    // No eliminar partidas en modo visualización
    if (seasonViewMode) {
      setErrorMessage('No se pueden eliminar partidas mientras visualizas una temporada pasada');
      return;
    }

    // Verificar que hay partidas para eliminar
    if (gameHistory.length === 0) {
      setErrorMessage('No hay partidas para eliminar');
      return;
    }

    try {
      const lastGame = gameHistory[0]; // La última partida está al inicio del array
      
      // Confirmar eliminación
      if (!window.confirm(`¿Eliminar la última partida? ${lastGame.result} (${lastGame.pointsChange >= 0 ? '+' : ''}${lastGame.pointsChange}pts)`)) {
        return;
      }

      // 1. Remover la partida del historial
      const updatedGameHistory = gameHistory.slice(1);
      setGameHistory(updatedGameHistory);

      // 2. Revertir cambios en rankHistory
      const updatedRankHistory = {...rankHistory};
      const gameRankIndex = RANKS.findIndex(rank => rank.name === lastGame.rankName);
      if (gameRankIndex !== -1) {
        if (lastGame.result === 'Victoria') {
          updatedRankHistory[gameRankIndex].wins = Math.max(0, (updatedRankHistory[gameRankIndex]?.wins || 0) - 1);
          setWins(w => Math.max(0, w - 1));
        } else {
          updatedRankHistory[gameRankIndex].losses = Math.max(0, (updatedRankHistory[gameRankIndex]?.losses || 0) - 1);
          setLosses(l => Math.max(0, l - 1));
        }
      }

      // 3. Revertir cambios en deckStats
      const updatedDeckStats = {...deckStats};
      const deckKey = lastGame.deck || "(Sin Mazo)";
      if (updatedDeckStats[deckKey]) {
        if (lastGame.result === 'Victoria') {
          updatedDeckStats[deckKey].wins = Math.max(0, updatedDeckStats[deckKey].wins - 1);
        } else {
          updatedDeckStats[deckKey].losses = Math.max(0, updatedDeckStats[deckKey].losses - 1);
        }
        
        // Eliminar entrada del mazo si no tiene partidas
        if (updatedDeckStats[deckKey].wins === 0 && updatedDeckStats[deckKey].losses === 0) {
          delete updatedDeckStats[deckKey];
        }
      }

      // 4. Revertir puntos
      const newPoints = Math.max(0, points - lastGame.pointsChange);
      setPoints(newPoints);

      // 5. Recalcular win streak desde el historial actualizado
      let newWinStreak = 0;
      for (const game of updatedGameHistory) {
        if (game.result === 'Victoria') {
          newWinStreak++;
        } else {
          break; // La racha se rompe en la primera derrota
        }
      }
      setWinStreak(newWinStreak);

      setRankHistory(updatedRankHistory);
      setDeckStats(updatedDeckStats);

      setSuccessMessage('Última partida eliminada');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error eliminando última partida:', error);
      setErrorMessage('Error al eliminar partida');
    }
  }, [gameHistory, seasonViewMode, rankHistory, deckStats, points]);

  // Modificada para usar la estructura de temporadas
  const recordGame = React.useCallback((isWin) => {
      // No registrar partidas en modo visualización
      if (seasonViewMode) {
        setErrorMessage('No se pueden registrar partidas mientras visualizas una temporada pasada');
        return;
      }
      
      try {
        const updatedRankHistory = {...rankHistory};
        const updatedDeckStats = {...deckStats};
        const deckKey = currentDeckName.trim() || "(Sin Mazo)"; // Usar "(Sin Mazo)" si está vacío

        let currentPoints = points;
        let currentWinStreak = winStreak;
        let pointsChange = 0;
        const rankData = RANKS[currentRank];

        if (!updatedDeckStats[deckKey]) { updatedDeckStats[deckKey] = { wins: 0, losses: 0 }; } // Inicializar si no existe

        if (isWin) {
          updatedRankHistory[currentRank].wins = (updatedRankHistory[currentRank]?.wins || 0) + 1;
          updatedDeckStats[deckKey].wins += 1; // Actualizar stats del mazo
          currentWinStreak += 1;
          setWins(w => w + 1);
          pointsChange = rankData.winPoints;
          // Sistema de rachas extendido para todos los rangos incluido Master Ball
          const streakBonus = WIN_STREAK_BONUS[Math.min(currentWinStreak - 1, WIN_STREAK_BONUS.length - 1)];
          pointsChange += streakBonus;
        } else {
          updatedRankHistory[currentRank].losses = (updatedRankHistory[currentRank]?.losses || 0) + 1;
          updatedDeckStats[deckKey].losses += 1; // Actualizar stats del mazo
          currentWinStreak = 0;
          setLosses(l => l + 1);
          pointsChange = -rankData.lossPoints;
        }

        const newPoints = Math.max(0, currentPoints + pointsChange);
        setPoints(newPoints);
        setWinStreak(currentWinStreak);
        setRankHistory(updatedRankHistory);
        setDeckStats(updatedDeckStats); // Guardar estado actualizado de deckStats

        const gameInfo = { // Guardar nombre del mazo en historial
            result: isWin ? 'Victoria' : 'Derrota', pointsChange, newPoints,
            rankName: rankData.name, deck: deckKey, // Guardar el deckKey
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date().toISOString()
        };
        setGameHistory(gh => [gameInfo, ...gh].slice(0, 50));
        setErrorMessage('');
      } catch (error) { 
        console.error('Error registrando partida:', error); 
        setErrorMessage('Error registrando partida'); 
      }
  }, [points, winStreak, currentRank, rankHistory, deckStats, currentDeckName, seasonViewMode]);

  // Modificada para incluir información de temporadas
  const exportData = React.useCallback(() => {
       try {
          const dataToExport = { 
            currentSeason: {
              ...currentSeason,
              points,
              wins,
              losses,
              winStreak,
              gameHistory,
              rankHistory,
              deckStats,
              currentDeckName,
              lastUpdated: new Date().toISOString()
            },
            seasons,
            exportDate: new Date().toISOString(), 
            version: DATA_VERSION, 
            appVersion: APP_CONFIG.version 
          };
          const jsonString = JSON.stringify(dataToExport, null, 2);
          const blob = new Blob([jsonString], { type: 'application/json' });
          const file = new File([blob], `pokemon-tcg-data-${new Date().toISOString().slice(0,10)}.json`, { type: 'application/json' });

          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file], title: 'Datos Pokémon TCG Pocket', text: 'Exportación de datos.' })
              .then(() => setSuccessMessage('Datos compartidos.'))
              .catch((error) => { if (error.name !== 'AbortError') downloadFile(jsonString); });
          } else { downloadFile(jsonString); }
           setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) { 
          console.error('Error exportando:', error); 
          setErrorMessage('Error al exportar datos'); 
          setTimeout(() => setErrorMessage(''), 5000); 
        }
  }, [points, wins, losses, winStreak, gameHistory, rankHistory, deckStats, currentDeckName, currentSeason, seasons]);

  const downloadFile = (jsonString) => { /* ... (sin cambios) ... */
     const blob = new Blob([jsonString], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `pokemon-tcg-data-${new Date().toISOString().slice(0,10)}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); setSuccessMessage('Datos exportados.');
   };

  // Modificada para importar datos con estructura de temporadas
  const importData = React.useCallback(() => {
      try {
        if (!importText.trim()) { setErrorMessage('No hay datos para importar'); return; }
        const importedData = JSON.parse(importText);
        
        // Migrar a formato de temporadas si es necesario
        const migratedData = migrateDataToSeasons(importedData);
        
        if (!migratedData.currentSeason) throw new Error('Datos incompletos: Falta información de temporada');
        
        // Actualizar datos de la temporada actual
        const currentSeasonData = migratedData.currentSeason;
        
        // Inicializar rankHistory correctamente
        const updatedRankHistory = initRankHistory();
        const importedRankHistory = currentSeasonData.rankHistory || {};
        
        Object.keys(updatedRankHistory).forEach(rankIdx => { 
          if (importedRankHistory[rankIdx]) { 
            updatedRankHistory[rankIdx].wins = importedRankHistory[rankIdx].wins || 0; 
            updatedRankHistory[rankIdx].losses = importedRankHistory[rankIdx].losses || 0; 
          } 
        });
        
        // Actualizar todos los estados
        setPoints(currentSeasonData.points || 0); 
        setWins(currentSeasonData.wins || 0); 
        setLosses(currentSeasonData.losses || 0); 
        setWinStreak(currentSeasonData.winStreak || 0); 
        setGameHistory(currentSeasonData.gameHistory || []); 
        setRankHistory(updatedRankHistory);
        setDeckStats(currentSeasonData.deckStats || {}); 
        setCurrentDeckName(currentSeasonData.currentDeckName || '');
        
        // Actualizar información de temporadas
        setCurrentSeason(currentSeasonData);
        setSeasons(migratedData.seasons || []);
        
        // Desactivar modo visualización
        setSeasonViewMode(false);
        setSelectedSeason(null);

        // Guardar en almacenamiento
        const dataToSave = { 
          currentSeason: currentSeasonData,
          seasons: migratedData.seasons || [],
          autoload: true, 
          lastUpdated: new Date().toISOString(), 
          importedFrom: migratedData.exportDate,
          version: DATA_VERSION, 
          appVersion: APP_CONFIG.version, 
          previousVersion: migratedData.version || 'desconocida'
        };
        saveToStorage(dataToSave);

        setView('main'); 
        setShowImportDialog(false); 
        setImportText(''); 
        setSuccessMessage('Datos importados.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) { 
        console.error('Error importando:', error); 
        setErrorMessage('Error al importar: ' + error.message); 
        setTimeout(() => setErrorMessage(''), 5000); 
      }
  }, [importText, initRankHistory, saveToStorage, migrateDataToSeasons]);

  const handleFileImport = (event) => { /* ... (sin cambios) ... */
    const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => { try { setImportText(e.target.result); } catch (error) { console.error('Error leyendo archivo:', error); setErrorMessage('Error al leer archivo'); } }; reader.readAsText(file);
  };

  // Modificada para compartir datos de la temporada actual
  const shareData = React.useCallback(async () => {
      try { 
        const seasonName = seasonViewMode && selectedSeason 
          ? selectedSeason.name 
          : currentSeason.name;
        
        const dataToShare = { 
          p: points, w: wins, l: losses, s: winStreak, r: currentRank, 
          v: DATA_VERSION, n: seasonName 
        };
        
        const encodedData = encodeURIComponent(JSON.stringify(dataToShare)); 
        const url = `${window.location.origin}${window.location.pathname}?data=${encodedData}`;
        
        setShareUrl(url); 
        
        if (navigator.share) { 
          await navigator.share({ 
            title: 'Mis datos de Pokémon TCG Pocket', 
            text: `${seasonName}: ${RANKS[currentRank].name}, ${points}pts, ${wins}W-${losses}L`, 
            url: url 
          }); 
          setSuccessMessage('¡Datos compartidos!'); 
        } else { 
          await navigator.clipboard.writeText(url); 
          setSuccessMessage('Enlace copiado.'); 
        } 
        
        setTimeout(() => setSuccessMessage(''), 3000); 
      } catch (error) { 
        console.error('Error compartiendo:', error); 
        if (error.name !== 'AbortError') { 
          setErrorMessage('Error al compartir.'); 
          setTimeout(() => setErrorMessage(''), 5000); 
        } 
      }
  }, [points, wins, losses, winStreak, currentRank, currentSeason, selectedSeason, seasonViewMode]);

  React.useEffect(() => { /* Load data from URL */ /* ... (sin cambios) ... */
     if (!dbReady) return; try { const urlParams = new URLSearchParams(window.location.search); const encodedData = urlParams.get('data'); if (encodedData) { const data = JSON.parse(decodeURIComponent(encodedData)); if (data.v && data.p !== undefined) { setSetupPoints(data.p.toString()); setSetupWins(data.w.toString()); setSetupLosses(data.l.toString()); setSetupWinStreak(data.s.toString()); setSuccessMessage('Datos cargados desde enlace.'); setTimeout(() => setSuccessMessage(''), 3000); window.history.replaceState({}, document.title, window.location.pathname); } } } catch (error) { console.error('Error cargando desde URL:', error); }
   }, [dbReady]);

  const installPWA = async () => { /* ... (sin cambios) ... */
     if (!installPrompt) return; try { installPrompt.prompt(); const { outcome } = await installPrompt.userChoice; if (outcome === 'accepted') setSuccessMessage('¡App instalada!'); setInstallPrompt(null); } catch (error) { console.error('Error instalando PWA:', error); }
   };

  // --- Estilos para Iconos (sin cambios) ---
  const iconStyleSmall = { marginRight: '0.25rem', width: '18px', height: '18px', display: 'inline-block', verticalAlign: 'middle' };
  const iconStyleMedium = { marginRight: '0.5rem', width: '20px', height: '20px', display: 'inline-block', verticalAlign: 'middle' };

  // === Renderizado ===

  // --- Render Setup View ---
  if (view === 'setup') {
    return ( <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md flex flex-col space-y-4"> {/* ... JSX Setup View (sin cambios lógicos) ... */} <h1 className="text-2xl font-bold text-center text-blue-600">Pokémon TCG Pocket - Rastreador de Ranking</h1> {errorMessage && ( <div className="p-3 bg-red-100 text-red-700 rounded-lg">{errorMessage}</div> )} {successMessage && ( <div className="p-3 bg-green-100 text-green-700 rounded-lg">{successMessage}</div> )} {!isStandalone && installPrompt && ( <div className="p-4 bg-blue-50 rounded-lg text-center"><p className="mb-2 text-sm text-blue-800">¡Instalá la app para un acceso más rápido!</p><button onClick={installPWA} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">Instalar App</button></div> )} <div><label className="block text-sm font-medium text-gray-700 mb-1">Puntos actuales:</label><input type="number" value={setupPoints} onChange={(e) => setSetupPoints(e.target.value)} className="w-full p-2 border rounded shadow-sm" placeholder="0"/></div> <div><label className="block text-sm font-medium text-gray-700 mb-1">Victorias:</label><input type="number" value={setupWins} onChange={(e) => setSetupWins(e.target.value)} className="w-full p-2 border rounded shadow-sm" placeholder="0"/></div> <div><label className="block text-sm font-medium text-gray-700 mb-1">Derrotas:</label><input type="number" value={setupLosses} onChange={(e) => setSetupLosses(e.target.value)} className="w-full p-2 border rounded shadow-sm" placeholder="0"/></div> <div><label className="block text-sm font-medium text-gray-700 mb-1">Victorias consecutivas actuales:</label><input type="number" value={setupWinStreak} onChange={(e) => setSetupWinStreak(e.target.value)} className="w-full p-2 border rounded shadow-sm" placeholder="0" min="0"/><p className="text-xs text-gray-500 mt-1">Importante para cálculo correcto de bonos</p></div> <button onClick={handleSetupSubmit} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 px-4 rounded transition duration-150 ease-in-out">Comenzar Seguimiento</button> <div className="border-t pt-4"><p className="text-gray-600 text-sm text-center mb-2">¿Ya tenés datos guardados?</p><button onClick={() => setShowImportDialog(true)} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center transition duration-150 ease-in-out"><i data-lucide="upload" style={iconStyleMedium}></i> Importar Datos</button></div> <div className="mt-4 text-center"><p className="text-xs text-gray-400">Versión {APP_CONFIG.version}</p></div> {showImportDialog && ( <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"><h2 className="text-xl font-bold mb-4 text-gray-800">Importar Datos</h2><div className="space-y-4"><div><p className="text-sm text-gray-600 mb-2">Sube un archivo JSON:</p><input type="file" accept=".json" onChange={handleFileImport} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">O pega el contenido:</label><textarea value={importText} onChange={(e) => setImportText(e.target.value)} className="w-full p-2 border rounded h-32 text-sm font-mono" placeholder='{"points": 0, ...}'></textarea></div><div className="flex space-x-2"><button onClick={importData} disabled={!importText.trim()} className={`flex-1 font-bold py-2 px-4 rounded transition ${!importText.trim() ? 'bg-green-300 text-white cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}>Importar</button><button onClick={() => { setShowImportDialog(false); setImportText(''); }} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition">Cancelar</button></div></div></div></div> )} </div> );
  }

  // --- Render Main View ---
  const currentWinRate = calculateWinRate(wins, losses);
  const gamesToMaster = calculateGamesToMasterBall();
  const nextRankIndex = currentRank < 16 ? currentRank + 1 : 16;
  const pointsToNextRankDisplay = currentRank < 16 ? (RANKS[nextRankIndex]?.points || 0) - points : 0;
  const nextRankName = currentRank < 16 ? RANKS[nextRankIndex]?.name : '';
  const currentStreakBonusDisplay = winStreak > 0 ? WIN_STREAK_BONUS[Math.min(winStreak, WIN_STREAK_BONUS.length - 1)] : 0;

  return (
    <div className="p-4 max-w-2xl mx-auto bg-gray-100 min-h-screen">
      {errorMessage && ( <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg shadow">{errorMessage}</div> )}
      {successMessage && ( <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg shadow">{successMessage}</div> )}

      <div className="bg-white rounded-xl shadow-md p-6 mb-4">
        <h1 className="text-2xl font-bold text-center mb-4 text-blue-600">Pokémon TCG Pocket - Tracker</h1>
        
        {/* *** Información de temporada *** */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <div className="mb-2 sm:mb-0">
            <span className="text-sm font-semibold text-gray-600 mr-2">
              {seasonViewMode && selectedSeason 
                ? `Temporada: ${selectedSeason.name} (Vista)`
                : `Temporada actual: ${currentSeason.name}`
              }
            </span>
            <span className="text-xs text-gray-500">
              {seasonViewMode && selectedSeason
                ? `(${formatDate(selectedSeason.startDate)})`
                : `(${formatDate(currentSeason.startDate)})`
              }
            </span>
          </div>
          <div className="flex space-x-2 text-sm">
            {seasonViewMode ? (
              <button 
                onClick={returnToCurrentSeason} 
                className="flex items-center text-blue-600 hover:text-blue-800 transition"
              >
                <i data-lucide="arrow-left" style={iconStyleSmall}></i> Volver a temporada actual
              </button>
            ) : (
              <>
                <button 
                  onClick={() => setShowSeasonsDialog(true)} 
                  className="flex items-center text-blue-600 hover:text-blue-800 transition"
                >
                  <i data-lucide="history" style={iconStyleSmall}></i> Ver temporadas
                </button>
                <button 
                  onClick={() => setShowNewSeasonDialog(true)} 
                  className="flex items-center text-purple-600 hover:text-purple-800 transition"
                >
                  <i data-lucide="plus-circle" style={iconStyleSmall}></i> Nueva temporada
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4 mb-4 text-sm">
          <button onClick={shareData} className="flex items-center text-blue-600 hover:text-blue-800 transition"><i data-lucide="share-2" style={iconStyleSmall}></i> Compartir</button>
          <button onClick={exportData} className="flex items-center text-blue-600 hover:text-blue-800 transition"><i data-lucide="download" style={iconStyleSmall}></i> Exportar</button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center shadow-sm"><h2 className="text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wider">Rango Actual</h2><div className="text-lg font-bold text-blue-700">{RANKS[currentRank]?.name || 'Desconocido'}</div><div className="mt-1 text-xs text-gray-500">{pointsToNextRankDisplay > 0 && nextRankName ? `${pointsToNextRankDisplay} pts para ${nextRankName}` : (currentRank >= 16 ? "¡Rango máximo!" : "")}</div></div>
          <div className="bg-blue-50 p-4 rounded-lg text-center shadow-sm"><h2 className="text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wider">Puntos</h2><div className="text-lg font-bold text-blue-700">{points}</div><div className="mt-1 text-xs text-gray-500 h-4">{currentStreakBonusDisplay > 0 ? `Victorias consecutivas: ${winStreak} (+${currentStreakBonusDisplay} pts)` : ''}</div></div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-green-50 p-3 rounded-lg text-center shadow-sm"><h3 className="text-xs font-semibold text-gray-600 mb-1 uppercase">Victorias</h3><div className="text-base font-bold text-green-600">{wins}</div></div>
          <div className="bg-red-50 p-3 rounded-lg text-center shadow-sm"><h3 className="text-xs font-semibold text-gray-600 mb-1 uppercase">Derrotas</h3><div className="text-base font-bold text-red-600">{losses}</div></div>
          <div className="bg-purple-50 p-3 rounded-lg text-center shadow-sm"><h3 className="text-xs font-semibold text-gray-600 mb-1 uppercase">Winrate</h3><div className="text-base font-bold text-purple-600">{currentWinRate}%</div></div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wider">Proyección Master Ball</h2>
          <div className="text-lg font-bold text-yellow-700">{gamesToMaster === Infinity ? "Winrate insuficiente" : (gamesToMaster === 0 && currentRank >= 16 ? "¡Alcanzado!" : `~${gamesToMaster} partidas`)}</div>
          <div className="mt-1 text-xs text-gray-500">Con {currentWinRate}% winrate</div>
        </div>

        {/* Input Nombre de Mazo */}
        <div className="mb-4">
          <label htmlFor="deckNameInput" className="block text-sm font-medium text-gray-700 mb-1">Mazo Actual:</label>
          <input 
            type="text" 
            id="deckNameInput" 
            value={currentDeckName} 
            onChange={(e) => setCurrentDeckName(e.target.value)} 
            placeholder="Ej: Gardevoir ex" 
            className="w-full p-2 border rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
            disabled={seasonViewMode} // Desactivar en modo visualización
          />
          <p className="text-xs text-gray-500 mt-1">
            {seasonViewMode 
              ? "No se puede modificar en modo visualización" 
              : "Este nombre se guardará con la próxima partida."
            }
          </p>
        </div>

        <div className="flex space-x-2 mb-4">
          {/* Solo mostrar botones de partida si no estamos en modo visualización */}
          {!seasonViewMode ? (
            <>
              <button 
                onClick={() => recordGame(true)} 
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded flex items-center justify-center shadow hover:shadow-md transition"
              >
                <i data-lucide="chevron-up" style={iconStyleMedium}></i> Victoria
              </button>
              <button 
                onClick={() => recordGame(false)} 
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded flex items-center justify-center shadow hover:shadow-md transition"
              >
                <i data-lucide="chevron-down" style={iconStyleMedium}></i> Derrota
              </button>
            </>
          ) : (
            <div className="flex-1 bg-gray-200 p-3 rounded-lg text-center text-gray-600">
              <i data-lucide="eye" style={iconStyleMedium}></i> Modo visualización - No se pueden registrar partidas
            </div>
          )}
        </div>

        {/* Botón para eliminar última partida */}
        {!seasonViewMode && gameHistory.length > 0 && (
          <div className="mb-6">
            <button 
              onClick={deleteLastGame} 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center shadow hover:shadow-md transition"
            >
              <i data-lucide="undo-2" style={iconStyleMedium}></i> Eliminar última partida
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-4">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Historial de Partidas</h2>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {gameHistory.length > 0 ? ( gameHistory.map((game, idx) => ( <div key={idx} className={`p-3 rounded-lg text-sm flex justify-between items-center ${game.result === 'Victoria' ? 'bg-green-50' : 'bg-red-50'}`}><div><span className={`font-semibold ${game.result === 'Victoria' ? 'text-green-700' : 'text-red-700'}`}>{game.result}</span> <span className="text-gray-500 ml-2 text-xs">({game.rankName}{game.deck && game.deck !== '(Sin Mazo)' ? ` / ${game.deck}` : ''})</span></div><div className="text-right"><span className={`font-semibold ${game.pointsChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>{game.pointsChange >= 0 ? '+' : ''}{game.pointsChange}pts</span><span className="text-gray-400 ml-2 text-xs block">{game.timestamp}</span></div></div> )) ) : ( <div className="text-center text-gray-500 py-4">No hay partidas registradas</div> )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-4">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Rendimiento por Rango</h2>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {Object.entries(rankHistory).filter(([, stats]) => stats.wins + stats.losses > 0).sort(([rankIdxA], [rankIdxB]) => parseInt(rankIdxB) - parseInt(rankIdxA)).map(([rankIdx, stats]) => { const rank = RANKS[parseInt(rankIdx)]; const winRate = calculateWinRate(stats.wins, stats.losses); return ( <div key={rankIdx} className="p-3 bg-gray-50 rounded-lg"><div className="flex justify-between items-center mb-1"><div className="font-medium text-sm text-gray-800">{rank.name}</div><div className="text-xs"><span className="text-green-600 font-medium">{stats.wins}W</span> <span className="text-gray-400">-</span> <span className="text-red-600 font-medium">{stats.losses}L</span></div></div><div className="w-full bg-gray-200 rounded-full h-1.5 mb-1"><div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${winRate}%` }}></div></div><div className="flex justify-between text-xs text-gray-500"><span>WR: {winRate}%</span><span className="font-medium text-right">{calculateRankProjection(parseInt(rankIdx))}</span></div></div> ); })}
          {Object.values(rankHistory).every(stats => stats.wins + stats.losses === 0) && ( <div className="text-center text-gray-500 py-4">Sin datos de rendimiento por rango.</div> )}
        </div>
      </div>

      {/* Rendimiento por Mazo */}
      <div className="bg-white rounded-xl shadow-md p-6 mt-4">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Rendimiento por Mazo</h2>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {Object.entries(deckStats)
            .sort(([deckNameA], [deckNameB]) => deckNameA.localeCompare(deckNameB))
            .map(([deckName, stats]) => {
              if (stats.wins + stats.losses === 0) return null;
              const deckWinRate = calculateWinRate(stats.wins, stats.losses);
              return (
                <div key={deckName} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-medium text-sm text-gray-800 truncate pr-2" title={deckName}>{deckName}</div>
                    <div className="text-xs flex-shrink-0">
                      <span className="text-green-600 font-medium">{stats.wins}W</span> <span className="text-gray-400">-</span> <span className="text-red-600 font-medium">{stats.losses}L</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                    <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${deckWinRate}%` }}></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    <span>Winrate: {deckWinRate}%</span>
                  </div>
                </div>
              );
          })}
          {Object.keys(deckStats).length === 0 || Object.values(deckStats).every(s => s.wins + s.losses === 0) ? (
              <div className="text-center text-gray-500 py-4">No hay datos de rendimiento por mazo.</div>
          ) : null}
        </div>
      </div>

      <div className="mt-6 text-center">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-2">
          <button onClick={() => setView('setup')} className="text-blue-500 hover:text-blue-700 text-sm font-medium">Editar config</button>
          <button onClick={() => setShowImportDialog(true)} className="text-green-500 hover:text-green-700 text-sm font-medium">Importar datos</button>
          <button 
            onClick={() => { 
              if (window.confirm('¿Borrar todos los datos? No se puede deshacer.')) { 
                try { 
                  if (window.indexedDB) { 
                    indexedDB.deleteDatabase(APP_NAME).onsuccess = () => console.log("DB borrada"); 
                  } 
                  localStorage.clear(); 
                  window.location.reload(); 
                } catch (e) { 
                  console.error("Error borrando datos:", e); 
                  alert("Error al borrar datos."); 
                }
              } 
            }} 
            className="text-red-500 hover:text-red-700 text-sm font-medium"
          >
            Borrar datos
          </button>
        </div>
        <p className="text-xs text-gray-500">Datos guardados automáticamente.</p>
        <p className="text-xs text-gray-400 mt-1">Versión {APP_CONFIG.version}</p>
      </div>
      
      {/* Diálogo de importación */}
      {showImportDialog && ( 
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Importar Datos</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Sube un archivo JSON:</p>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleFileImport} 
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">O pega el contenido:</label>
                <textarea 
                  value={importText} 
                  onChange={(e) => setImportText(e.target.value)} 
                  className="w-full p-2 border rounded h-32 text-sm font-mono" 
                  placeholder='{"points": 0, ...}'
                ></textarea>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={importData} 
                  disabled={!importText.trim()} 
                  className={`flex-1 font-bold py-2 px-4 rounded transition ${!importText.trim() ? 'bg-green-300 text-white cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                >
                  Importar
                </button>
                <button 
                  onClick={() => { setShowImportDialog(false); setImportText(''); }} 
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div> 
      )}
      
      {/* Diálogo de nueva temporada */}
      {showNewSeasonDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Iniciar Nueva Temporada</h2>
            <div className="space-y-4">
              <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800 mb-4">
                <p><strong>¡Importante!</strong> Iniciar una nueva temporada guardará todos tus datos actuales en el historial. La temporada actual se convertirá en histórica.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la nueva temporada:</label>
                <input 
                  type="text" 
                  value={newSeasonName} 
                  onChange={(e) => setNewSeasonName(e.target.value)} 
                  className="w-full p-2 border rounded shadow-sm" 
                  placeholder="Ej: Temporada 2"
                />
              </div>
              
              <div className="border-t pt-3">
                <p className="text-sm font-medium text-gray-700 mb-3">Selecciona cómo quieres iniciar la nueva temporada:</p>
                
                <div className="space-y-3">
                  {/* Opción 1: Descenso oficial */}
                  <div 
                    className={`p-3 rounded-lg border cursor-pointer ${newSeasonMode === 'official' ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                    onClick={() => setNewSeasonMode('official')}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={`h-4 w-4 rounded-full border ${newSeasonMode === 'official' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                          {newSeasonMode === 'official' && <div className="h-2 w-2 rounded-full bg-white mx-auto mt-0.5"></div>}
                        </div>
                      </div>
                      <div className="ml-2 flex-1">
                        <h3 className="text-sm font-medium text-gray-800">Descenso oficial</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Utiliza el sistema oficial de descenso de rango entre temporadas.
                        </p>
                        
                        {newSeasonMode === 'official' && (
                          <div className="mt-2 p-2 bg-blue-100 rounded text-sm">
                            <p className="font-medium text-blue-800">
                              Tu rango actual: {RANKS[currentRank]?.name}
                            </p>
                            <p className="text-blue-700 mt-1">
                              Descenderás a: {RANKS[getNewSeasonRank(currentRank, points)]?.name} ({getInitialPointsForRank(getNewSeasonRank(currentRank, points))} pts)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Opción 2: Personalizado */}
                  <div 
                    className={`p-3 rounded-lg border cursor-pointer ${newSeasonMode === 'custom' ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'}`}
                    onClick={() => setNewSeasonMode('custom')}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={`h-4 w-4 rounded-full border ${newSeasonMode === 'custom' ? 'border-purple-500 bg-purple-500' : 'border-gray-300'}`}>
                          {newSeasonMode === 'custom' && <div className="h-2 w-2 rounded-full bg-white mx-auto mt-0.5"></div>}
                        </div>
                      </div>
                      <div className="ml-2 flex-1">
                        <h3 className="text-sm font-medium text-gray-800">Personalizado</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Selecciona manualmente tu rango y puntos iniciales.
                        </p>
                        
                        {newSeasonMode === 'custom' && (
                          <div className="mt-2 space-y-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Rango inicial:</label>
                              <select 
                                value={customRankIndex}
                                onChange={(e) => {
                                  const newRank = parseInt(e.target.value);
                                  setCustomRankIndex(newRank);
                                  setCustomPoints(RANKS[newRank].points.toString());
                                }}
                                className="w-full p-2 text-sm border rounded"
                              >
                                {RANKS.map((rank, idx) => (
                                  <option key={idx} value={idx}>{rank.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Puntos iniciales:</label>
                              <input
                                type="number"
                                value={customPoints}
                                onChange={(e) => setCustomPoints(e.target.value)}
                                className="w-full p-2 text-sm border rounded"
                                min={RANKS[customRankIndex].points}
                                max={customRankIndex < RANKS.length - 1 ? RANKS[customRankIndex + 1].points - 1 : 2000}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                (Min: {RANKS[customRankIndex].points} pts {customRankIndex < RANKS.length - 1 ? `/ Max: ${RANKS[customRankIndex + 1].points - 1} pts` : ''})
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2 pt-2">
                <button 
                  onClick={() => startNewSeason(newSeasonName)}
                  disabled={!newSeasonName.trim()} 
                  className={`flex-1 font-bold py-2 px-4 rounded transition ${!newSeasonName.trim() ? 'bg-purple-300 text-white cursor-not-allowed' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
                >
                  Iniciar Nueva Temporada
                </button>
                <button 
                  onClick={() => { 
                    setShowNewSeasonDialog(false); 
                    setNewSeasonName('');
                    setNewSeasonMode('official');
                    setCustomRankIndex(0);
                    setCustomPoints('0');
                  }} 
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Diálogo de temporadas */}
      {showSeasonsDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Historial de Temporadas</h2>
            <div className="space-y-4">
              <div className="max-h-96 overflow-y-auto space-y-3">
                {/* Temporada actual */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-semibold">{currentSeason.name} <span className="text-xs font-normal text-blue-600">(Actual)</span></div>
                    <div className="text-sm text-gray-500">{formatDate(currentSeason.startDate)}</div>
                  </div>
                  <div className="text-sm text-gray-700 mb-1">
                    {RANKS[currentRank]?.name || 'Desconocido'} | {currentSeason.points || points} pts
                  </div>
                  <div className="text-xs text-gray-600">
                    {currentSeason.wins || wins}W - {currentSeason.losses || losses}L | WR: {calculateWinRate(currentSeason.wins || wins, currentSeason.losses || losses)}%
                  </div>
                </div>
                
                {/* Temporadas pasadas */}
                {seasons.length > 0 ? (
                  seasons.map((season, index) => {
                    // Calcular el rango que tenía en esa temporada
                    let seasonRank = 0;
                    for (let i = RANKS.length - 1; i >= 0; i--) {
                      if (season.points >= RANKS[i].points) { 
                        seasonRank = i; 
                        break; 
                      }
                    }
                    
                    return (
                      <div key={season.id} className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                        <div className="flex justify-between items-center mb-1">
                          <div className="font-semibold">{season.name}</div>
                          <div className="text-sm text-gray-500">{formatDate(season.startDate)}</div>
                        </div>
                        <div className="text-sm text-gray-700 mb-1">
                          {RANKS[seasonRank]?.name || 'Desconocido'} | {season.points} pts
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          {season.wins}W - {season.losses}L | WR: {calculateWinRate(season.wins, season.losses)}%
                        </div>
                        <button 
                          onClick={() => viewSeasonData(index)} 
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <i data-lucide="eye" style={iconStyleSmall}></i> Ver detalles
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-500 py-6">
                    No hay temporadas anteriores
                  </div>
                )}
              </div>
              
              <div className="pt-3 border-t">
                <button 
                  onClick={() => setShowSeasonsDialog(false)} 
                  className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Renderizado con createRoot (React 18)
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<PokemonTCGRankTracker />);

// --- END OF FILE /static/js/main.js (v1.0.7 - Sistema de Temporadas) ---
