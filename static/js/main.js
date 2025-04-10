// --- START OF FILE /static/js/main.js (v1.0.5 - Cálculos optimizados) ---

// Pokémon TCG Pocket Rank Tracker
// Versión: 1.0.5
// Última actualización: 2025-04-10 (Fecha hipotética)

const RANKS = [ { name: "Beginner Rank #1", points: 0, winPoints: 10, lossPoints: 0 }, { name: "Beginner Rank #2", points: 20, winPoints: 10, lossPoints: 0 }, { name: "Beginner Rank #3", points: 50, winPoints: 10, lossPoints: 0 }, { name: "Beginner Rank #4", points: 95, winPoints: 10, lossPoints: 0 }, { name: "Poké Ball Rank #1", points: 145, winPoints: 10, lossPoints: 5 }, { name: "Poké Ball Rank #2", points: 195, winPoints: 10, lossPoints: 5 }, { name: "Poké Ball Rank #3", points: 245, winPoints: 10, lossPoints: 5 }, { name: "Poké Ball Rank #4", points: 300, winPoints: 10, lossPoints: 5 }, { name: "Great Ball Rank #1", points: 355, winPoints: 10, lossPoints: 5 }, { name: "Great Ball Rank #2", points: 420, winPoints: 10, lossPoints: 5 }, { name: "Great Ball Rank #3", points: 490, winPoints: 10, lossPoints: 5 }, { name: "Great Ball Rank #4", points: 600, winPoints: 10, lossPoints: 5 }, { name: "Ultra Ball Rank #1", points: 710, winPoints: 10, lossPoints: 7 }, { name: "Ultra Ball Rank #2", points: 860, winPoints: 10, lossPoints: 7 }, { name: "Ultra Ball Rank #3", points: 1010, winPoints: 10, lossPoints: 7 }, { name: "Ultra Ball Rank #4", points: 1225, winPoints: 10, lossPoints: 7 }, { name: "Master Ball Rank", points: 1450, winPoints: 10, lossPoints: 10 } ];
const WIN_STREAK_BONUS = [0, 3, 6, 9, 12];
const APP_NAME = 'pokemon-tcg-rank-tracker';
const IDB_KEY = 'userData';
const DATA_VERSION = '1.1';
const APP_CONFIG = { version: '1.0.5', buildDate: '2025-04-10', dataVersion: DATA_VERSION };

const PokemonTCGRankTracker = () => {
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

  const initRankHistory = React.useCallback(() => { // useCallback si no depende de props/estado externo
    const newRankHistory = {};
    RANKS.forEach((rank, index) => { newRankHistory[index] = { wins: 0, losses: 0 }; });
    return newRankHistory;
  }, []); // Vacío porque RANKS es constante global

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

  const loadFromStorage = React.useCallback(async () => { /* Load Data Function (useCallback ya que no cambia) */
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
  }, []); // Dependencias vacías

  const saveToStorage = React.useCallback(async (data) => { /* Save Data Function (useCallback) */
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
  }, []); // Dependencia setErrorMessage si la usara dentro, pero es externa

  React.useEffect(() => { /* Load Data on DB Ready */
    if (!dbReady) return;
    const loadInitialData = async () => {
      try {
        const data = await loadFromStorage();
        if (data) {
          if (data.version && data.version !== DATA_VERSION) console.warn(`Versión de datos ${data.version} != ${DATA_VERSION}.`);
          setSetupPoints(data.points?.toString() || '0');
          setSetupWins(data.wins?.toString() || '0');
          setSetupLosses(data.losses?.toString() || '0');
          setSetupWinStreak(data.winStreak?.toString() || '0');
          if (data.autoload) {
            setPoints(data.points || 0);
            setWins(data.wins || 0);
            setLosses(data.losses || 0);
            setWinStreak(data.winStreak || 0);
            setGameHistory(data.gameHistory || []);
            const loadedRankHistory = data.rankHistory || {};
            const initializedRankHistory = initRankHistory();
            Object.keys(initializedRankHistory).forEach(rankIdx => { if (loadedRankHistory[rankIdx]) { initializedRankHistory[rankIdx].wins = loadedRankHistory[rankIdx].wins || 0; initializedRankHistory[rankIdx].losses = loadedRankHistory[rankIdx].losses || 0; } });
            setRankHistory(initializedRankHistory);
            setView('main');
          } else { setRankHistory(initRankHistory()); }
        } else { setRankHistory(initRankHistory()); }
      } catch (error) { console.error('Error cargando datos:', error); setErrorMessage('Error cargando datos guardados'); setRankHistory(initRankHistory()); }
    };
    loadInitialData();
  }, [dbReady, loadFromStorage, initRankHistory]); // Añadir dependencias usadas

  React.useEffect(() => { /* Save Data on Change */
    if (view === 'main' && dbReady) {
      const dataToSave = { points, wins, losses, winStreak, gameHistory, rankHistory, autoload: true, lastUpdated: new Date().toISOString(), version: DATA_VERSION, appVersion: APP_CONFIG.version };
      saveToStorage(dataToSave).catch(error => { setErrorMessage('Hubo un problema al guardar los datos.'); });
    }
  }, [points, wins, losses, winStreak, gameHistory, rankHistory, view, dbReady, saveToStorage]); // Añadir saveToStorage

  React.useEffect(() => { /* Calculate Current Rank */
    let rank = 0;
    for (let i = RANKS.length - 1; i >= 0; i--) { if (points >= RANKS[i].points) { rank = i; break; } }
    setCurrentRank(rank);
  }, [points]);

  React.useEffect(() => { /* Lucide Icons Update */
     if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
       try { lucide.createIcons(); } catch (error) { console.error("Error lucide.createIcons:", error); }
     } else { console.warn("Lucide no listo."); }
  }, [view, showImportDialog]);

  // --- Funciones de Cálculo ---
  const calculateWinRate = React.useCallback((w, l) => {
    const total = w + l;
    return total > 0 ? ((w / total) * 100).toFixed(1) : '0.0';
  }, []);

  const calculateGamesToMasterBall = React.useCallback(() => {
    try {
      if (currentRank >= 16) return 0;
      const targetPoints = RANKS[16].points;
      if (points >= targetPoints) return 0; // Ya está o superó

      const pointsNeededTotal = targetPoints - points;
      const globalWinRate = (wins + losses > 0) ? wins / (wins + losses) : 0.5;

      let estimatedTotalGames = 0;
      let currentSimulatedPoints = points;

      for (let i = currentRank; i < 16; i++) {
          const rankData = RANKS[i];
          const nextRankPoints = (i + 1 < RANKS.length) ? RANKS[i+1].points : targetPoints; // Punto de inicio del siguiente rango o Master
          const pointsNeededForThisRank = nextRankPoints - currentSimulatedPoints;

          if (pointsNeededForThisRank <= 0) { // Si ya estamos en el siguiente rango virtualmente
              currentSimulatedPoints = Math.max(currentSimulatedPoints, rankData.points); // Asegurar que empezamos desde el inicio del rango si ya lo pasamos
              continue;
          }

          const winPoints = rankData.winPoints;
          const lossPoints = rankData.lossPoints;
          const streakApplies = i <= 11; // Hasta Great Ball Rank #4

          let avgStreakBonus = 0;
          if (streakApplies) {
              if (globalWinRate > 0.8) avgStreakBonus = 9;
              else if (globalWinRate > 0.65) avgStreakBonus = 6;
              else if (globalWinRate > 0.5) avgStreakBonus = 3;
          }

          const effectiveWinPoints = winPoints + avgStreakBonus;
          const netPointsPerGame = (globalWinRate * effectiveWinPoints) - ((1 - globalWinRate) * lossPoints);

          if (netPointsPerGame <= 0) return Infinity; // Imposible progresar con este winrate en este rango

          const gamesForThisRank = Math.ceil(pointsNeededForThisRank / netPointsPerGame);
          estimatedTotalGames += gamesForThisRank;

          // Actualizar puntos simulados para el siguiente ciclo (o final)
          // No es estrictamente necesario para el total de juegos, pero útil si quisiéramos más detalle
          currentSimulatedPoints += pointsNeededForThisRank;
      }

      return estimatedTotalGames;

    } catch (error) {
      console.error('Error calculando juegos hasta Master Ball:', error);
      return Infinity;
    }
  }, [currentRank, points, wins, losses]); // Dependencias de estado/calculadas usadas

  const calculateRankProjection = React.useCallback((rankIndex) => { /* Rank Projection (sin cambios internos) */
      try {
        const rank = RANKS[rankIndex];
        const nextRankIndex = rankIndex + 1; // Siempre habrá uno más hasta Master
        if (nextRankIndex >= RANKS.length) return "¡Rango máximo!"; // Si ya es Master
        const nextRank = RANKS[nextRankIndex];

        let pointsNeeded;
        // Si es el rango actual Y AÚN estamos en él (no en Master)
        if (rankIndex === currentRank && currentRank < 16) {
            pointsNeeded = nextRank.points - points;
        } else if (rankIndex < currentRank) { // Si es un rango pasado, no aplica proyección
             return "-";
        }
        else { // Si es un rango futuro (no debería mostrarse si no hay datos, pero por si acaso)
            pointsNeeded = nextRank.points - rank.points;
        }

        if (pointsNeeded <=0) return "Completado"; // Si ya se superó

        const rankStats = rankHistory[rankIndex] || { wins: 0, losses: 0 };
        const totalGamesInRank = rankStats.wins + rankStats.losses;
        let rankWinRate;

        if (totalGamesInRank > 0) { rankWinRate = rankStats.wins / totalGamesInRank; }
        else if (wins + losses > 0) { rankWinRate = wins / (wins + losses); } // Fallback a global
        else { rankWinRate = 0.5; } // Fallback a 50% si no hay datos

        const winPoints = rank.winPoints;
        const lossPoints = rank.lossPoints;
        const streakApplies = rankIndex <= 11;

        let avgStreakBonus = 0;
        if (streakApplies) {
            if (rankWinRate > 0.8) avgStreakBonus = 9;
            else if (rankWinRate > 0.65) avgStreakBonus = 6;
            else if (rankWinRate > 0.5) avgStreakBonus = 3;
        }
        const effectiveWinPoints = winPoints + avgStreakBonus;
        const netPointsPerGame = (rankWinRate * effectiveWinPoints) - ((1 - rankWinRate) * lossPoints);

        if (netPointsPerGame <= 0) {
             const requiredWinRate = (lossPoints / (winPoints + lossPoints));
             return `${pointsNeeded} pts | Req: >${(requiredWinRate * 100).toFixed(0)}% WR`;
        }
        const estimatedGames = Math.ceil(pointsNeeded / netPointsPerGame);
        return `${pointsNeeded} pts | ~${estimatedGames} partidas`;
      } catch (error) { console.error('Error proyección rango:', error); return "Error"; }
  }, [points, wins, losses, currentRank, rankHistory]); // Dependencias

  // --- Funciones de Acción ---
  const handleSetupSubmit = React.useCallback(() => { /* Setup Submit */
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
      setView('main');
      setErrorMessage('');
      const dataToSave = { points: initialPoints, wins: initialWins, losses: initialLosses, winStreak: initialWinStreak, gameHistory: [], rankHistory: newRankHistory, autoload: true, lastUpdated: new Date().toISOString(), version: DATA_VERSION, appVersion: APP_CONFIG.version };
      saveToStorage(dataToSave).catch(err => console.error("Error guardando en setup:", err));
    } catch (error) { console.error('Error en setup:', error); setErrorMessage('Error en la configuración.'); }
  }, [setupPoints, setupWins, setupLosses, setupWinStreak, initRankHistory, saveToStorage]); // Dependencias

  const recordGame = React.useCallback((isWin) => { /* Record Game */
      try {
        const updatedRankHistory = {...rankHistory};
        let currentPoints = points; // Usar una variable local para el cálculo inmediato
        let currentWinStreak = winStreak;
        let pointsChange = 0;
        const rankData = RANKS[currentRank];

        if (isWin) {
          updatedRankHistory[currentRank].wins = (updatedRankHistory[currentRank]?.wins || 0) + 1;
          currentWinStreak += 1;
          setWins(w => w + 1);
          pointsChange = rankData.winPoints;
          if (currentRank <= 11) { // Streak bonus aplica hasta Great Ball 4
            const streakBonus = WIN_STREAK_BONUS[Math.min(currentWinStreak, WIN_STREAK_BONUS.length - 1)];
            pointsChange += streakBonus;
          }
        } else {
          updatedRankHistory[currentRank].losses = (updatedRankHistory[currentRank]?.losses || 0) + 1;
          currentWinStreak = 0; // Resetear racha
          setLosses(l => l + 1);
          pointsChange = -rankData.lossPoints;
        }

        const newPoints = Math.max(0, currentPoints + pointsChange);
        setPoints(newPoints);
        setWinStreak(currentWinStreak); // Actualizar estado de racha
        setRankHistory(updatedRankHistory);

        const gameInfo = { result: isWin ? 'Victoria' : 'Derrota', pointsChange, newPoints, rankName: rankData.name, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), date: new Date().toISOString() };
        setGameHistory(gh => [gameInfo, ...gh].slice(0, 50)); // Limitar historial a 50 entradas
        setErrorMessage('');
      } catch (error) { console.error('Error registrando partida:', error); setErrorMessage('Error registrando partida'); }
  }, [points, wins, losses, winStreak, currentRank, rankHistory]); // Dependencias

  const exportData = React.useCallback(() => { /* Export Data */
      // ... (tu código de exportación, sin cambios internos necesarios aquí) ...
       try {
          const dataToExport = { points, wins, losses, winStreak, gameHistory, rankHistory, exportDate: new Date().toISOString(), version: DATA_VERSION, appVersion: APP_CONFIG.version };
          const jsonString = JSON.stringify(dataToExport, null, 2);
          const blob = new Blob([jsonString], { type: 'application/json' });
          const file = new File([blob], `pokemon-tcg-data-${new Date().toISOString().slice(0,10)}.json`, { type: 'application/json' });

          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file], title: 'Datos Pokémon TCG Pocket', text: 'Exportación de datos.' })
              .then(() => setSuccessMessage('Datos compartidos.'))
              .catch((error) => { if (error.name !== 'AbortError') downloadFile(jsonString); }); // Fallback si falla share
          } else { downloadFile(jsonString); } // Fallback si share no es soportado
           setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) { console.error('Error exportando:', error); setErrorMessage('Error al exportar datos'); setTimeout(() => setErrorMessage(''), 5000); }
  }, [points, wins, losses, winStreak, gameHistory, rankHistory]); // Dependencias

   const downloadFile = (jsonString) => { /* Download Helper */
     const blob = new Blob([jsonString], { type: 'application/json' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url; a.download = `pokemon-tcg-data-${new Date().toISOString().slice(0,10)}.json`;
     document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
     setSuccessMessage('Datos exportados.');
   };

  const importData = React.useCallback(() => { /* Import Data */
      try {
        if (!importText.trim()) { setErrorMessage('No hay datos para importar'); return; }
        const importedData = JSON.parse(importText);
        if (importedData.points === undefined) throw new Error('Datos incompletos: Faltan puntos');

        const impPoints = importedData.points || 0;
        const impWins = importedData.wins || 0;
        const impLosses = importedData.losses || 0;
        const impWinStreak = importedData.winStreak || 0;
        const impGameHistory = importedData.gameHistory || [];
        const impRankHistory = importedData.rankHistory || {};
        const updatedRankHistory = initRankHistory();
        Object.keys(updatedRankHistory).forEach(rankIdx => { if (impRankHistory[rankIdx]) { updatedRankHistory[rankIdx].wins = impRankHistory[rankIdx].wins || 0; updatedRankHistory[rankIdx].losses = impRankHistory[rankIdx].losses || 0; } });

        setPoints(impPoints); setWins(impWins); setLosses(impLosses); setWinStreak(impWinStreak); setGameHistory(impGameHistory); setRankHistory(updatedRankHistory);

        const dataToSave = { points: impPoints, wins: impWins, losses: impLosses, winStreak: impWinStreak, gameHistory: impGameHistory, rankHistory: updatedRankHistory, autoload: true, lastUpdated: new Date().toISOString(), importedFrom: importedData.exportDate, version: DATA_VERSION, appVersion: APP_CONFIG.version, previousVersion: importedData.version || 'desconocida' };
        saveToStorage(dataToSave);

        setView('main'); setShowImportDialog(false); setImportText(''); setSuccessMessage('Datos importados.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) { console.error('Error importando:', error); setErrorMessage('Error al importar: ' + error.message); setTimeout(() => setErrorMessage(''), 5000); }
  }, [importText, initRankHistory, saveToStorage]); // Dependencias

  const handleFileImport = (event) => { /* Handle File Input */
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { try { setImportText(e.target.result); } catch (error) { console.error('Error leyendo archivo:', error); setErrorMessage('Error al leer archivo'); } };
    reader.readAsText(file);
  };

  const shareData = React.useCallback(async () => { /* Share Data */
      try {
        const dataToShare = { p: points, w: wins, l: losses, s: winStreak, r: currentRank, v: DATA_VERSION };
        const encodedData = encodeURIComponent(JSON.stringify(dataToShare));
        const url = `${window.location.origin}${window.location.pathname}?data=${encodedData}`;
        setShareUrl(url);

        if (navigator.share) {
          await navigator.share({ title: 'Mis datos de Pokémon TCG Pocket', text: `Progreso: ${RANKS[currentRank].name}, ${points}pts, ${wins}W-${losses}L`, url: url });
          setSuccessMessage('¡Datos compartidos!');
        } else { await navigator.clipboard.writeText(url); setSuccessMessage('Enlace copiado.'); }
         setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) { console.error('Error compartiendo:', error); if (error.name !== 'AbortError') { setErrorMessage('Error al compartir.'); setTimeout(() => setErrorMessage(''), 5000); } }
  }, [points, wins, losses, winStreak, currentRank]); // Dependencias

   React.useEffect(() => { /* Load data from URL */
     if (!dbReady) return;
     try {
       const urlParams = new URLSearchParams(window.location.search);
       const encodedData = urlParams.get('data');
       if (encodedData) {
         const data = JSON.parse(decodeURIComponent(encodedData));
         if (data.v && data.p !== undefined) {
           setSetupPoints(data.p.toString()); setSetupWins(data.w.toString()); setSetupLosses(data.l.toString()); setSetupWinStreak(data.s.toString());
           setSuccessMessage('Datos cargados desde enlace.'); setTimeout(() => setSuccessMessage(''), 3000);
           window.history.replaceState({}, document.title, window.location.pathname);
         }
       }
     } catch (error) { console.error('Error cargando desde URL:', error); }
   }, [dbReady]); // Ejecutar solo una vez cuando db esté lista

   const installPWA = async () => { /* Install PWA */
     if (!installPrompt) return;
     try {
       installPrompt.prompt();
       const { outcome } = await installPrompt.userChoice;
       if (outcome === 'accepted') setSuccessMessage('¡App instalada!');
       setInstallPrompt(null);
     } catch (error) { console.error('Error instalando PWA:', error); }
   };

   // --- Estilos para Iconos (sin cambios) ---
   const iconStyleSmall = { marginRight: '0.25rem', width: '18px', height: '18px', display: 'inline-block', verticalAlign: 'middle' };
   const iconStyleMedium = { marginRight: '0.5rem', width: '20px', height: '20px', display: 'inline-block', verticalAlign: 'middle' };

  // === Renderizado ===

  // --- Render Setup View ---
  if (view === 'setup') {
    return ( <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md flex flex-col space-y-4"> {/* ... JSX Setup View (sin cambios lógicos) ... */} <h1 className="text-2xl font-bold text-center text-blue-600">Pokémon TCG Pocket - Rastreador de Ranking</h1> {errorMessage && ( <div className="p-3 bg-red-100 text-red-700 rounded-lg">{errorMessage}</div> )} {successMessage && ( <div className="p-3 bg-green-100 text-green-700 rounded-lg">{successMessage}</div> )} {!isStandalone && installPrompt && ( <div className="p-4 bg-blue-50 rounded-lg text-center"><p className="mb-2 text-sm text-blue-800">¡Instalá la app para un acceso más rápido!</p><button onClick={installPWA} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">Instalar App</button></div> )} <div><label className="block text-sm font-medium text-gray-700 mb-1">Puntos actuales:</label><input type="number" value={setupPoints} onChange={(e) => setSetupPoints(e.target.value)} className="w-full p-2 border rounded shadow-sm" placeholder="0"/></div> <div><label className="block text-sm font-medium text-gray-700 mb-1">Victorias:</label><input type="number" value={setupWins} onChange={(e) => setSetupWins(e.target.value)} className="w-full p-2 border rounded shadow-sm" placeholder="0"/></div> <div><label className="block text-sm font-medium text-gray-700 mb-1">Derrotas:</label><input type="number" value={setupLosses} onChange={(e) => setSetupLosses(e.target.value)} className="w-full p-2 border rounded shadow-sm" placeholder="0"/></div> <div><label className="block text-sm font-medium text-gray-700 mb-1">Racha actual de victorias:</label><input type="number" value={setupWinStreak} onChange={(e) => setSetupWinStreak(e.target.value)} className="w-full p-2 border rounded shadow-sm" placeholder="0" min="0"/><p className="text-xs text-gray-500 mt-1">Importante para cálculo correcto de bonos</p></div> <button onClick={handleSetupSubmit} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 px-4 rounded transition duration-150 ease-in-out">Comenzar Seguimiento</button> <div className="border-t pt-4"><p className="text-gray-600 text-sm text-center mb-2">¿Ya tenés datos guardados?</p><button onClick={() => setShowImportDialog(true)} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center transition duration-150 ease-in-out"><i data-lucide="upload" style={iconStyleMedium}></i> Importar Datos</button></div> <div className="mt-4 text-center"><p className="text-xs text-gray-400">Versión {APP_CONFIG.version}</p></div> {showImportDialog && ( <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"><h2 className="text-xl font-bold mb-4 text-gray-800">Importar Datos</h2><div className="space-y-4"><div><p className="text-sm text-gray-600 mb-2">Sube un archivo JSON:</p><input type="file" accept=".json" onChange={handleFileImport} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">O pega el contenido:</label><textarea value={importText} onChange={(e) => setImportText(e.target.value)} className="w-full p-2 border rounded h-32 text-sm font-mono" placeholder='{"points": 0, ...}'></textarea></div><div className="flex space-x-2"><button onClick={importData} disabled={!importText.trim()} className={`flex-1 font-bold py-2 px-4 rounded transition ${!importText.trim() ? 'bg-green-300 text-white cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}>Importar</button><button onClick={() => { setShowImportDialog(false); setImportText(''); }} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition">Cancelar</button></div></div></div></div> )} </div> );
  }

  // --- Render Main View ---

  // *** Calcular valores derivados UNA VEZ antes de retornar el JSX ***
  const currentWinRate = calculateWinRate(wins, losses);
  const gamesToMaster = calculateGamesToMasterBall();
  const nextRankIndex = currentRank < 16 ? currentRank + 1 : 16;
  const pointsToNextRankDisplay = currentRank < 16 ? (RANKS[nextRankIndex]?.points || 0) - points : 0;
  const nextRankName = currentRank < 16 ? RANKS[nextRankIndex]?.name : '';
  const currentStreakBonusDisplay = currentRank <= 11 && winStreak > 0 ? WIN_STREAK_BONUS[Math.min(winStreak, WIN_STREAK_BONUS.length - 1)] : 0;

  return (
    <div className="p-4 max-w-2xl mx-auto bg-gray-100 min-h-screen">
      {errorMessage && ( <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg shadow">{errorMessage}</div> )}
      {successMessage && ( <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg shadow">{successMessage}</div> )}

      <div className="bg-white rounded-xl shadow-md p-6 mb-4">
        <h1 className="text-2xl font-bold text-center mb-4 text-blue-600">Pokémon TCG Pocket - Tracker</h1>

        <div className="flex justify-end space-x-4 mb-4 text-sm">
          <button onClick={shareData} className="flex items-center text-blue-600 hover:text-blue-800 transition"><i data-lucide="share-2" style={iconStyleSmall}></i> Compartir</button>
          <button onClick={exportData} className="flex items-center text-blue-600 hover:text-blue-800 transition"><i data-lucide="download" style={iconStyleSmall}></i> Exportar</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center shadow-sm">
            <h2 className="text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wider">Rango Actual</h2>
            <div className="text-lg font-bold text-blue-700">{RANKS[currentRank]?.name || 'Desconocido'}</div>
            <div className="mt-1 text-xs text-gray-500">
              {/* Usar variables calculadas */}
              {pointsToNextRankDisplay > 0 && nextRankName ? `${pointsToNextRankDisplay} pts para ${nextRankName}` : (currentRank >= 16 ? "¡Rango máximo!" : "")}
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center shadow-sm">
            <h2 className="text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wider">Puntos</h2>
            <div className="text-lg font-bold text-blue-700">{points}</div>
            <div className="mt-1 text-xs text-gray-500 h-4">
              {/* Usar variable calculada */}
              {currentStreakBonusDisplay > 0 ? `Racha: ${winStreak} (+${currentStreakBonusDisplay} pts)` : ''}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-green-50 p-3 rounded-lg text-center shadow-sm"><h3 className="text-xs font-semibold text-gray-600 mb-1 uppercase">Victorias</h3><div className="text-base font-bold text-green-600">{wins}</div></div>
          <div className="bg-red-50 p-3 rounded-lg text-center shadow-sm"><h3 className="text-xs font-semibold text-gray-600 mb-1 uppercase">Derrotas</h3><div className="text-base font-bold text-red-600">{losses}</div></div>
          <div className="bg-purple-50 p-3 rounded-lg text-center shadow-sm">
            <h3 className="text-xs font-semibold text-gray-600 mb-1 uppercase">Winrate</h3>
            {/* Usar variable calculada */}
            <div className="text-base font-bold text-purple-600">{currentWinRate}%</div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg text-center mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wider">Proyección Master Ball</h2>
          {/* Usar variable calculada */}
          <div className="text-lg font-bold text-yellow-700">
            {gamesToMaster === Infinity ? "Winrate insuficiente" : (gamesToMaster === 0 && currentRank >= 16 ? "¡Alcanzado!" : `~${gamesToMaster} partidas`)}
          </div>
          {/* Usar variable calculada */}
          <div className="mt-1 text-xs text-gray-500">Con {currentWinRate}% winrate</div>
        </div>

        <div className="flex space-x-2 mb-6">
          <button onClick={() => recordGame(true)} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded flex items-center justify-center shadow hover:shadow-md transition"><i data-lucide="chevron-up" style={iconStyleMedium}></i> Victoria</button>
          <button onClick={() => recordGame(false)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded flex items-center justify-center shadow hover:shadow-md transition"><i data-lucide="chevron-down" style={iconStyleMedium}></i> Derrota</button>
        </div>
      </div>

      {/* --- Historial y Rendimiento por Rango (sin cambios en la lógica de renderizado, usa calculateRankProjection) --- */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-4">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Historial de Partidas</h2>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {gameHistory.length > 0 ? ( gameHistory.map((game, idx) => ( <div key={idx} className={`p-3 rounded-lg text-sm flex justify-between items-center ${game.result === 'Victoria' ? 'bg-green-50' : 'bg-red-50'}`}><div><span className={`font-semibold ${game.result === 'Victoria' ? 'text-green-700' : 'text-red-700'}`}>{game.result}</span><span className="text-gray-500 ml-2 text-xs">({game.rankName})</span></div><div className="text-right"><span className={`font-semibold ${game.pointsChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>{game.pointsChange >= 0 ? '+' : ''}{game.pointsChange}pts</span><span className="text-gray-400 ml-2 text-xs block">{game.timestamp}</span></div></div> )) ) : ( <div className="text-center text-gray-500 py-4">No hay partidas registradas</div> )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Rendimiento por Rango</h2>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {Object.entries(rankHistory).filter(([, stats]) => stats.wins + stats.losses > 0).sort(([rankIdxA], [rankIdxB]) => parseInt(rankIdxB) - parseInt(rankIdxA)).map(([rankIdx, stats]) => { const rank = RANKS[parseInt(rankIdx)]; const winRate = calculateWinRate(stats.wins, stats.losses); return ( <div key={rankIdx} className="p-3 bg-gray-50 rounded-lg"><div className="flex justify-between items-center mb-1"><div className="font-medium text-sm text-gray-800">{rank.name}</div><div className="text-xs"><span className="text-green-600 font-medium">{stats.wins}W</span> <span className="text-gray-400">-</span> <span className="text-red-600 font-medium">{stats.losses}L</span></div></div><div className="w-full bg-gray-200 rounded-full h-1.5 mb-1"><div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${winRate}%` }}></div></div><div className="flex justify-between text-xs text-gray-500"><span>WR: {winRate}%</span>{/* calculateRankProjection sigue aquí porque depende del rankIdx específico del map */} <span className="font-medium text-right">{calculateRankProjection(parseInt(rankIdx))}</span></div></div> ); })}
          {Object.values(rankHistory).every(stats => stats.wins + stats.losses === 0) && ( <div className="text-center text-gray-500 py-4">Sin datos de rendimiento.</div> )}
        </div>
      </div>

      {/* --- Botones de Opciones y Modal (sin cambios lógicos) --- */}
      <div className="mt-6 text-center">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-2">
          <button onClick={() => setView('setup')} className="text-blue-500 hover:text-blue-700 text-sm font-medium">Editar config</button>
          <button onClick={() => setShowImportDialog(true)} className="text-green-500 hover:text-green-700 text-sm font-medium">Importar datos</button>
          <button onClick={() => { if (window.confirm('¿Borrar todos los datos? No se puede deshacer.')) { try { if (window.indexedDB) { indexedDB.deleteDatabase(APP_NAME).onsuccess = () => console.log("DB borrada"); } localStorage.clear(); window.location.reload(); } catch (e) { console.error("Error borrando datos:", e); alert("Error al borrar datos."); }} }} className="text-red-500 hover:text-red-700 text-sm font-medium">Borrar datos</button>
        </div>
        <p className="text-xs text-gray-500">Datos guardados automáticamente.</p>
        <p className="text-xs text-gray-400 mt-1">Versión {APP_CONFIG.version}</p>
      </div>
       {showImportDialog && ( <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"><h2 className="text-xl font-bold mb-4 text-gray-800">Importar Datos</h2><div className="space-y-4"><div><p className="text-sm text-gray-600 mb-2">Sube un archivo JSON:</p><input type="file" accept=".json" onChange={handleFileImport} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">O pega el contenido:</label><textarea value={importText} onChange={(e) => setImportText(e.target.value)} className="w-full p-2 border rounded h-32 text-sm font-mono" placeholder='{"points": 0, ...}'></textarea></div><div className="flex space-x-2"><button onClick={importData} disabled={!importText.trim()} className={`flex-1 font-bold py-2 px-4 rounded transition ${!importText.trim() ? 'bg-green-300 text-white cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}>Importar</button><button onClick={() => { setShowImportDialog(false); setImportText(''); }} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition">Cancelar</button></div></div></div></div> )}
    </div>
  );
};

// Renderizado con createRoot (React 18)
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<PokemonTCGRankTracker />);

// --- END OF FILE /static/js/main.js (v1.0.5 - Cálculos optimizados) ---
