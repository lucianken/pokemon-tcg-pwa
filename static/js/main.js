// --- START OF FILE /static/js/main.js (con logs de depuración) ---

// Pokémon TCG Pocket Rank Tracker
// Versión: 1.0.4 (Depuración)
// Última actualización: 2025-04-10 (Fecha hipotética)

// Definición de rangos y puntos necesarios (sin cambios)
const RANKS = [
  { name: "Beginner Rank #1", points: 0, winPoints: 10, lossPoints: 0 },
  { name: "Beginner Rank #2", points: 20, winPoints: 10, lossPoints: 0 },
  { name: "Beginner Rank #3", points: 50, winPoints: 10, lossPoints: 0 },
  { name: "Beginner Rank #4", points: 95, winPoints: 10, lossPoints: 0 },
  { name: "Poké Ball Rank #1", points: 145, winPoints: 10, lossPoints: 5 },
  { name: "Poké Ball Rank #2", points: 195, winPoints: 10, lossPoints: 5 },
  { name: "Poké Ball Rank #3", points: 245, winPoints: 10, lossPoints: 5 },
  { name: "Poké Ball Rank #4", points: 300, winPoints: 10, lossPoints: 5 },
  { name: "Great Ball Rank #1", points: 355, winPoints: 10, lossPoints: 5 },
  { name: "Great Ball Rank #2", points: 420, winPoints: 10, lossPoints: 5 },
  { name: "Great Ball Rank #3", points: 490, winPoints: 10, lossPoints: 5 },
  { name: "Great Ball Rank #4", points: 600, winPoints: 10, lossPoints: 5 },
  { name: "Ultra Ball Rank #1", points: 710, winPoints: 10, lossPoints: 7 },
  { name: "Ultra Ball Rank #2", points: 860, winPoints: 10, lossPoints: 7 },
  { name: "Ultra Ball Rank #3", points: 1010, winPoints: 10, lossPoints: 7 },
  { name: "Ultra Ball Rank #4", points: 1225, winPoints: 10, lossPoints: 7 },
  { name: "Master Ball Rank", points: 1450, winPoints: 10, lossPoints: 10 }
];

// Win streak bonuses (sin cambios)
const WIN_STREAK_BONUS = [0, 3, 6, 9, 12];

// Nombre de la aplicación para almacenamiento (sin cambios)
const APP_NAME = 'pokemon-tcg-rank-tracker';
const IDB_KEY = 'userData';
const DATA_VERSION = '1.1';

// Configuración del app (sin cambios)
const APP_CONFIG = {
  version: '1.0.4', // Actualizar versión si haces cambios
  buildDate: '2025-04-10', // Fecha hipotética
  dataVersion: DATA_VERSION,
};

const PokemonTCGRankTracker = () => {
  // Estados de la aplicación (sin cambios en la definición)
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

  // Inicializar el historial de rangos (sin cambios)
  const initRankHistory = () => {
    const newRankHistory = {};
    RANKS.forEach((rank, index) => {
      newRankHistory[index] = { wins: 0, losses: 0 };
    });
    // console.log("Historial de rangos inicializado:", newRankHistory); // Log opcional
    return newRankHistory;
  };

  // Verificar si la aplicación está instalada como PWA (sin cambios)
  React.useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    });
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      setIsStandalone(e.matches);
    });
  }, []);

  // Inicializar IndexedDB (sin cambios)
  React.useEffect(() => {
    const initDatabase = async () => {
      try {
        if (!window.indexedDB) {
          console.warn("Tu navegador no soporta IndexedDB, usando localStorage como fallback");
          setDbReady(true);
          return;
        }
        const dbRequest = indexedDB.open(APP_NAME, 1); // Version 1 de la DB
        dbRequest.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('userData')) {
            db.createObjectStore('userData', { keyPath: 'id' });
            console.log("Object store 'userData' creado.");
          }
        };
        dbRequest.onsuccess = () => {
          console.log("IndexedDB inicializada correctamente.");
          setDbReady(true);
        };
        dbRequest.onerror = (event) => {
          console.error("Error al inicializar IndexedDB:", event.target.error);
          setDbReady(true); // Continuar con localStorage como fallback
        };
      } catch (error) {
        console.error("Error crítico al configurar IndexedDB:", error);
        setDbReady(true); // Continuar con localStorage como fallback
      }
    };
    initDatabase();
  }, []);

  // Cargar datos guardados al iniciar (sin cambios en lógica)
  React.useEffect(() => {
    if (!dbReady) return;
    const loadData = async () => {
      console.log("DB lista, intentando cargar datos...");
      try {
        const data = await loadFromStorage();
        if (data) {
          console.log("Datos encontrados:", data);
          if (data.version && data.version !== DATA_VERSION) {
              console.warn(`Versión de datos cargada (${data.version}) es diferente a la actual (${DATA_VERSION}).`);
          }
          setSetupPoints(data.points?.toString() || '0');
          setSetupWins(data.wins?.toString() || '0');
          setSetupLosses(data.losses?.toString() || '0');
          setSetupWinStreak(data.winStreak?.toString() || '0');
          if (data.autoload) {
            console.log("Autoload activado, cargando datos en la vista principal.");
            setPoints(data.points || 0);
            setWins(data.wins || 0);
            setLosses(data.losses || 0);
            setWinStreak(data.winStreak || 0);
            setGameHistory(data.gameHistory || []);
            const loadedRankHistory = data.rankHistory || {};
            const initializedRankHistory = initRankHistory();
            Object.keys(initializedRankHistory).forEach(rankIdx => {
                if (loadedRankHistory[rankIdx]) {
                    initializedRankHistory[rankIdx].wins = loadedRankHistory[rankIdx].wins || 0;
                    initializedRankHistory[rankIdx].losses = loadedRankHistory[rankIdx].losses || 0;
                }
            });
            setRankHistory(initializedRankHistory);
            setView('main');
          } else {
            console.log("Autoload desactivado o no encontrado, permaneciendo en setup.");
            setRankHistory(initRankHistory());
          }
        } else {
          console.log("No se encontraron datos guardados. Inicializando historial de rangos.");
          setRankHistory(initRankHistory());
        }
      } catch (error) {
        console.error('Error cargando datos guardados:', error);
        setErrorMessage('Error cargando datos guardados');
        setRankHistory(initRankHistory());
      }
    };
    loadData();
  }, [dbReady]);

  // Función para cargar datos desde almacenamiento (sin cambios)
  const loadFromStorage = async () => {
    try {
      if (window.indexedDB) {
        return new Promise((resolve, reject) => {
          const dbRequest = indexedDB.open(APP_NAME, 1);
          dbRequest.onsuccess = (event) => {
            const db = event.target.result;
             if (!db.objectStoreNames.contains('userData')) {
                console.warn("Object store 'userData' no encontrado al leer. Devolviendo null.");
                resolve(null);
                return;
             }
            const transaction = db.transaction(['userData'], 'readonly');
            const objectStore = transaction.objectStore('userData');
            const request = objectStore.get(IDB_KEY);
            request.onsuccess = () => {
              console.log("Lectura de IndexedDB exitosa:", request.result ? "Datos encontrados" : "Sin datos");
              resolve(request.result ? request.result.data : null);
            };
            request.onerror = (event) => {
              console.error("Error al leer de IndexedDB:", event.target.error);
              reject(event.target.error);
            };
          };
          dbRequest.onerror = (event) => {
            console.error("Error al abrir IndexedDB para lectura:", event.target.error);
            reject(event.target.error);
          };
        });
      }
    } catch (error) {
      console.warn("Error con IndexedDB al cargar, intentando localStorage:", error);
    }
    const savedData = localStorage.getItem(`${APP_NAME}-data`);
    console.log("Cargando desde localStorage:", savedData ? "Datos encontrados" : "Sin datos");
    return savedData ? JSON.parse(savedData) : null;
  };

  // Función para guardar datos en almacenamiento (sin cambios)
  const saveToStorage = async (data) => {
    console.log("Intentando guardar datos:", data);
    try {
      if (window.indexedDB) {
        return new Promise((resolve, reject) => {
          const dbRequest = indexedDB.open(APP_NAME, 1);
          dbRequest.onsuccess = (event) => {
            const db = event.target.result;
             if (!db.objectStoreNames.contains('userData')) {
                console.error("Object store 'userData' no encontrado al guardar.");
                reject(new Error("Object store no existe"));
                return;
             }
            const transaction = db.transaction(['userData'], 'readwrite');
            const objectStore = transaction.objectStore('userData');
            const record = { id: IDB_KEY, data: data, timestamp: new Date().toISOString() };
            const request = objectStore.put(record);
            request.onsuccess = () => {
              console.log("Datos guardados en IndexedDB correctamente.");
              resolve(true);
            };
            request.onerror = (event) => {
              console.error("Error al escribir en IndexedDB:", event.target.error);
              reject(event.target.error);
            };
          };
          dbRequest.onerror = (event) => {
            console.error("Error al abrir IndexedDB para escritura:", event.target.error);
            reject(event.target.error);
          };
        });
      }
    } catch (error) {
      console.warn("Error con IndexedDB al guardar, usando localStorage:", error);
    }
    try {
      localStorage.setItem(`${APP_NAME}-data`, JSON.stringify(data));
      console.log("Datos guardados en localStorage.");
      return true;
    } catch (storageError) {
      console.error("Error al guardar en localStorage:", storageError);
      setErrorMessage("Error crítico: No se pudieron guardar los datos.");
      return false;
    }
  };

  // Guardar datos cuando cambian (sin cambios)
  React.useEffect(() => {
    if (view === 'main' && dbReady) {
      console.log("Estado cambiado en vista principal, guardando datos...");
      const dataToSave = {
        points, wins, losses, winStreak, gameHistory, rankHistory,
        autoload: true, lastUpdated: new Date().toISOString(),
        version: DATA_VERSION, appVersion: APP_CONFIG.version
      };
      saveToStorage(dataToSave).catch(error => {
          setErrorMessage('Hubo un problema al guardar los datos.');
      });
    }
  }, [points, wins, losses, winStreak, gameHistory, rankHistory, view, dbReady]);

  // Cálculo del rango actual basado en puntos (sin cambios)
  React.useEffect(() => {
    let rank = 0;
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (points >= RANKS[i].points) {
        rank = i;
        break;
      }
    }
    setCurrentRank(rank);
  }, [points]);

  // useEffect para inicializar/actualizar los íconos Lucide CON LOGS
  React.useEffect(() => {
     if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
        // --> LOG AÑADIDO <--
        console.log(`--- useEffect[view, showImportDialog] ejecutado. View: ${view}, Modal: ${showImportDialog}. Llamando a lucide.createIcons()`);
       try {
         lucide.createIcons();
       } catch (error) {
         // --> LOG AÑADIDO <--
         console.error("--- Error durante lucide.createIcons en useEffect:", error);
       }
     } else {
         // --> LOG AÑADIDO <--
         console.warn("--- Lucide no listo en useEffect[view, showImportDialog].");
     }
  }, [view, showImportDialog]); // Dependencias sin cambios

  // Generar URL para compartir datos (sin cambios)
  const generateShareUrl = () => { /* ... código ... */ };
  // Función para compartir datos (sin cambios)
  const shareData = async () => { /* ... código ... */ };
  // Extraer datos de la URL si existen (sin cambios)
  React.useEffect(() => { /* ... código ... */ }, [dbReady]);
  // Instalar PWA (sin cambios)
  const installPWA = async () => { /* ... código ... */ };

  // Iniciar configuración CON LOGS
  const handleSetupSubmit = () => {
    console.log(">>> 1. handleSetupSubmit INICIADO"); // <-- LOG AÑADIDO
    try {
      const initialPoints = parseInt(setupPoints) || 0;
      const initialWins = parseInt(setupWins) || 0;
      const initialLosses = parseInt(setupLosses) || 0;
      const initialWinStreak = parseInt(setupWinStreak) || 0;
      console.log(">>> 2. Valores parseados:", { initialPoints, initialWins, initialLosses, initialWinStreak }); // <-- LOG AÑADIDO

      setPoints(initialPoints);
      setWins(initialWins);
      setLosses(initialLosses);
      setWinStreak(initialWinStreak);
      console.log(">>> 3. Estado de puntos/victorias/etc. actualizado"); // <-- LOG AÑADIDO

      setGameHistory([]);
      const newRankHistory = initRankHistory(); // Llamada a la función
      setRankHistory(newRankHistory);
      console.log(">>> 4. Historial de partidas y rangos reiniciado"); // <-- LOG AÑADIDO

      // --- ¡Paso crucial! ---
      setView('main');
      console.log(">>> 5. VISTA CAMBIADA A 'main'"); // <-- LOG AÑADIDO

      setErrorMessage(''); // Limpiar errores

      console.log(">>> 6. Preparando datos para guardar..."); // <-- LOG AÑADIDO
      const dataToSave = {
        points: initialPoints,
        wins: initialWins,
        losses: initialLosses,
        winStreak: initialWinStreak,
        gameHistory: [],
        rankHistory: newRankHistory, // Usar la variable creada
        autoload: true,
        lastUpdated: new Date().toISOString(),
        version: DATA_VERSION,
        appVersion: APP_CONFIG.version
      };

      saveToStorage(dataToSave)
        .then(() => console.log(">>> 7. Guardado en storage exitoso (async)")) // <-- LOG AÑADIDO
        .catch(err => console.error(">>> 7. Error al guardar en storage (async):", err)); // <-- LOG AÑADIDO

      console.log(">>> 8. handleSetupSubmit COMPLETADO (parte síncrona)"); // <-- LOG AÑADIDO

    } catch (error) {
      // --> LOG AÑADIDO <--
      console.error('>>> ERROR en handleSetupSubmit:', error);
      setErrorMessage('Error en la configuración. Revisa la consola y los valores ingresados.');
    }
  };

  // Exportar datos a un archivo (sin cambios)
  const exportData = () => { /* ... código ... */ };
  // Función auxiliar para descargar archivo (sin cambios)
  const downloadFile = (jsonString) => { /* ... código ... */ };
  // Importar datos desde texto (sin cambios)
  const importData = () => { /* ... código ... */ };
  // Cargar archivo para importar (sin cambios)
  const handleFileImport = (event) => { /* ... código ... */ };
  // Registrar resultado de partida (sin cambios)
  const recordGame = (isWin) => { /* ... código ... */ };
  // Calcular estadísticas (sin cambios)
  const calculateWinRate = (w, l) => { /* ... código ... */ };
  // Calcular Proyección por Rango (sin cambios)
  const calculateRankProjection = (rankIndex) => { /* ... código ... */ };
  // Calcular juegos estimados hasta Master Ball (sin cambios)
  const calculateGamesToMasterBall = () => { /* ... código ... */ };

  // Calcular próximo rango (sin cambios)
  const nextRank = currentRank < 16 ? currentRank + 1 : 16;
  const pointsToNextRank = currentRank < 16 ? RANKS[nextRank].points - points : 0;
  // Calcular bonificación actual por racha (sin cambios)
  const currentStreakBonus = currentRank <= 11 && winStreak > 0 ?
    WIN_STREAK_BONUS[Math.min(winStreak, 4)] : 0;

  // Estilos comunes para los íconos (sin cambios)
  const iconStyleSmall = { marginRight: '0.25rem', width: '18px', height: '18px', display: 'inline-block', verticalAlign: 'middle' };
  const iconStyleMedium = { marginRight: '0.5rem', width: '20px', height: '20px', display: 'inline-block', verticalAlign: 'middle' };

  // Renderizar pantalla de configuración inicial (JSX sin cambios lógicos)
  if (view === 'setup') {
    return (
      <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md flex flex-col space-y-4">
        <h1 className="text-2xl font-bold text-center text-blue-600">Pokémon TCG Pocket - Rastreador de Ranking</h1>

        {errorMessage && ( <div className="p-3 bg-red-100 text-red-700 rounded-lg">{errorMessage}</div> )}
        {successMessage && ( <div className="p-3 bg-green-100 text-green-700 rounded-lg">{successMessage}</div> )}

        {!isStandalone && installPrompt && (
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <p className="mb-2 text-sm text-blue-800">¡Instalá la app para un acceso más rápido!</p>
            <button onClick={installPWA} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
              Instalar App
            </button>
          </div>
        )}

        <div><label className="block text-sm font-medium text-gray-700 mb-1">Puntos actuales:</label><input type="number" value={setupPoints} onChange={(e) => setSetupPoints(e.target.value)} className="w-full p-2 border rounded shadow-sm" placeholder="0"/></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Victorias:</label><input type="number" value={setupWins} onChange={(e) => setSetupWins(e.target.value)} className="w-full p-2 border rounded shadow-sm" placeholder="0"/></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Derrotas:</label><input type="number" value={setupLosses} onChange={(e) => setSetupLosses(e.target.value)} className="w-full p-2 border rounded shadow-sm" placeholder="0"/></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Racha actual de victorias:</label><input type="number" value={setupWinStreak} onChange={(e) => setSetupWinStreak(e.target.value)} className="w-full p-2 border rounded shadow-sm" placeholder="0" min="0"/><p className="text-xs text-gray-500 mt-1">Importante para cálculo correcto de bonos</p></div>

        {/* BOTÓN CON LA LÓGICA handleSetupSubmit */}
        <button onClick={handleSetupSubmit} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 px-4 rounded transition duration-150 ease-in-out">
          Comenzar Seguimiento
        </button>

        <div className="border-t pt-4">
          <p className="text-gray-600 text-sm text-center mb-2">¿Ya tenés datos guardados?</p>
          <button onClick={() => setShowImportDialog(true)} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center transition duration-150 ease-in-out">
             <i data-lucide="upload" style={iconStyleMedium}></i>
             Importar Datos
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">Versión {APP_CONFIG.version}</p>
        </div>

        {/* Modal de Importación (sin cambios) */}
        {showImportDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Importar Datos</h2>
              <div className="space-y-4">
                <div><p className="text-sm text-gray-600 mb-2">Sube un archivo JSON:</p><input type="file" accept=".json" onChange={handleFileImport} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">O pega el contenido:</label><textarea value={importText} onChange={(e) => setImportText(e.target.value)} className="w-full p-2 border rounded h-32 text-sm font-mono" placeholder='{"points": 0, ...}'></textarea></div>
                <div className="flex space-x-2">
                  <button onClick={importData} disabled={!importText.trim()} className={`flex-1 font-bold py-2 px-4 rounded transition ${!importText.trim() ? 'bg-green-300 text-white cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}>Importar</button>
                  <button onClick={() => { setShowImportDialog(false); setImportText(''); }} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition">Cancelar</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Vista principal (JSX sin cambios lógicos)
  return (
    <div className="p-4 max-w-2xl mx-auto bg-gray-100 min-h-screen">
      {errorMessage && ( <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg shadow">{errorMessage}</div> )}
      {successMessage && ( <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg shadow">{successMessage}</div> )}

      <div className="bg-white rounded-xl shadow-md p-6 mb-4">
        <h1 className="text-2xl font-bold text-center mb-4 text-blue-600">Pokémon TCG Pocket - Tracker</h1>

        <div className="flex justify-end space-x-4 mb-4 text-sm">
          <button onClick={shareData} className="flex items-center text-blue-600 hover:text-blue-800 transition">
            <i data-lucide="share-2" style={iconStyleSmall}></i> Compartir
          </button>
          <button onClick={exportData} className="flex items-center text-blue-600 hover:text-blue-800 transition">
            <i data-lucide="download" style={iconStyleSmall}></i> Exportar
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center shadow-sm"><h2 className="text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wider">Rango Actual</h2><div className="text-lg font-bold text-blue-700">{RANKS[currentRank].name}</div><div className="mt-1 text-xs text-gray-500">{pointsToNextRank > 0 ? `${pointsToNextRank} pts para ${RANKS[nextRank].name}` : "¡Rango máximo!"}</div></div>
          <div className="bg-blue-50 p-4 rounded-lg text-center shadow-sm"><h2 className="text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wider">Puntos</h2><div className="text-lg font-bold text-blue-700">{points}</div><div className="mt-1 text-xs text-gray-500 h-4">{winStreak > 0 && currentRank <= 11 ? `Racha: ${winStreak} (+${currentStreakBonus} pts)` : ''}</div></div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-green-50 p-3 rounded-lg text-center shadow-sm"><h3 className="text-xs font-semibold text-gray-600 mb-1 uppercase">Victorias</h3><div className="text-base font-bold text-green-600">{wins}</div></div>
          <div className="bg-red-50 p-3 rounded-lg text-center shadow-sm"><h3 className="text-xs font-semibold text-gray-600 mb-1 uppercase">Derrotas</h3><div className="text-base font-bold text-red-600">{losses}</div></div>
          <div className="bg-purple-50 p-3 rounded-lg text-center shadow-sm"><h3 className="text-xs font-semibold text-gray-600 mb-1 uppercase">Winrate</h3><div className="text-base font-bold text-purple-600">{calculateWinRate(wins, losses)}%</div></div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg text-center mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wider">Proyección Master Ball</h2>
          <div className="text-lg font-bold text-yellow-700">{calculateGamesToMasterBall() === Infinity ? "Winrate insuficiente" : `~${calculateGamesToMasterBall()} partidas`}</div>
          <div className="mt-1 text-xs text-gray-500">Con {calculateWinRate(wins, losses)}% winrate</div>
        </div>

        <div className="flex space-x-2 mb-6">
          <button onClick={() => recordGame(true)} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded flex items-center justify-center shadow hover:shadow-md transition"><i data-lucide="chevron-up" style={iconStyleMedium}></i> Victoria</button>
          <button onClick={() => recordGame(false)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded flex items-center justify-center shadow hover:shadow-md transition"><i data-lucide="chevron-down" style={iconStyleMedium}></i> Derrota</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-4">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Historial de Partidas</h2>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {gameHistory.length > 0 ? ( gameHistory.map((game, idx) => ( <div key={idx} className={`p-3 rounded-lg text-sm flex justify-between items-center ${game.result === 'Victoria' ? 'bg-green-50' : 'bg-red-50'}`}><div><span className={`font-semibold ${game.result === 'Victoria' ? 'text-green-700' : 'text-red-700'}`}>{game.result}</span><span className="text-gray-500 ml-2 text-xs">({game.rankName})</span></div><div className="text-right"><span className={`font-semibold ${game.pointsChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>{game.pointsChange >= 0 ? '+' : ''}{game.pointsChange}pts</span><span className="text-gray-400 ml-2 text-xs block">{game.timestamp}</span></div></div> )) ) : ( <div className="text-center text-gray-500 py-4">No hay partidas registradas</div> )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Rendimiento por Rango</h2>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {Object.entries(rankHistory).filter(([rankIdx, stats]) => stats.wins + stats.losses > 0).sort(([rankIdxA], [rankIdxB]) => parseInt(rankIdxB) - parseInt(rankIdxA)).map(([rankIdx, stats]) => { const rank = RANKS[parseInt(rankIdx)]; const winRate = calculateWinRate(stats.wins, stats.losses); return ( <div key={rankIdx} className="p-3 bg-gray-50 rounded-lg"><div className="flex justify-between items-center mb-1"><div className="font-medium text-sm text-gray-800">{rank.name}</div><div className="text-xs"><span className="text-green-600 font-medium">{stats.wins}W</span> <span className="text-gray-400">-</span> <span className="text-red-600 font-medium">{stats.losses}L</span></div></div><div className="w-full bg-gray-200 rounded-full h-1.5 mb-1"><div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${winRate}%` }}></div></div><div className="flex justify-between text-xs text-gray-500"><span>WR: {winRate}%</span><span className="font-medium text-right">{calculateRankProjection(parseInt(rankIdx))}</span></div></div> ); })}
          {Object.values(rankHistory).every(stats => stats.wins + stats.losses === 0) && ( <div className="text-center text-gray-500 py-4">Sin datos de rendimiento por rango.</div> )}
        </div>
      </div>

      <div className="mt-6 text-center">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-2">
          <button onClick={() => setView('setup')} className="text-blue-500 hover:text-blue-700 text-sm font-medium">Editar config</button>
          <button onClick={() => setShowImportDialog(true)} className="text-green-500 hover:text-green-700 text-sm font-medium">Importar datos</button>
          <button onClick={() => { if (window.confirm('¿Borrar todos los datos? No se puede deshacer.')) { try { if (window.indexedDB) { indexedDB.deleteDatabase(APP_NAME).onsuccess = () => console.log("DB borrada"); } localStorage.clear(); window.location.reload(); } catch (e) { console.error("Error borrando datos:", e); alert("Error al borrar datos."); }} }} className="text-red-500 hover:text-red-700 text-sm font-medium">Borrar datos</button>
        </div>
        <p className="text-xs text-gray-500">Datos guardados automáticamente.</p>
        <p className="text-xs text-gray-400 mt-1">Versión {APP_CONFIG.version}</p>
      </div>

      {/* Modal de Importación (Main View) */}
       {showImportDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
              {/* ... contenido del modal ... (igual que en setup view) */}
              <h2 className="text-xl font-bold mb-4 text-gray-800">Importar Datos</h2>
              <div className="space-y-4">
                <div><p className="text-sm text-gray-600 mb-2">Sube un archivo JSON:</p><input type="file" accept=".json" onChange={handleFileImport} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">O pega el contenido:</label><textarea value={importText} onChange={(e) => setImportText(e.target.value)} className="w-full p-2 border rounded h-32 text-sm font-mono" placeholder='{"points": 0, ...}'></textarea></div>
                <div className="flex space-x-2">
                  <button onClick={importData} disabled={!importText.trim()} className={`flex-1 font-bold py-2 px-4 rounded transition ${!importText.trim() ? 'bg-green-300 text-white cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}>Importar</button>
                  <button onClick={() => { setShowImportDialog(false); setImportText(''); }} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition">Cancelar</button>
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

// --- END OF FILE /static/js/main.js (con logs de depuración) ---
