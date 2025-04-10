// Pokémon TCG Pocket Rank Tracker
// Versión: 1.0.2
// Última actualización: 2025-04-09

// Definición de rangos y puntos necesarios
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

// Win streak bonuses
const WIN_STREAK_BONUS = [0, 3, 6, 9, 12];

// Nombre de la aplicación para almacenamiento
const APP_NAME = 'pokemon-tcg-rank-tracker';

// Clave de IndexedDB
const IDB_KEY = 'userData';

// Versión de datos
const DATA_VERSION = '1.1';

// Configuración del app
const APP_CONFIG = {
  version: '1.0.2',
  buildDate: '2025-04-09',
  dataVersion: DATA_VERSION,
};

// Extraer los íconos que necesitamos de Lucide
const { icons } = lucide;
const ChevronUp = icons.ChevronUp;
const ChevronDown = icons.ChevronDown;
const Download = icons.Download;
const Upload = icons.Upload;
const Share2 = icons.Share2;
const Save = icons.Save;

const PokemonTCGRankTracker = () => {
  // Estados de la aplicación
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

  // Inicializar el historial de rangos
  const initRankHistory = () => {
    const newRankHistory = {};
    RANKS.forEach((rank, index) => {
      newRankHistory[index] = { wins: 0, losses: 0 };
    });
    return newRankHistory;
  };

  // Verificar si la aplicación está instalada como PWA
  React.useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    
    // Evento para capturar la solicitud de instalación
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevenir comportamiento predeterminado
      e.preventDefault();
      // Guardar el evento para usarlo más tarde
      setInstallPrompt(e);
    });
    
    // Detectar cambios en el modo de visualización
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      setIsStandalone(e.matches);
    });
  }, []);

  // Inicializar IndexedDB
  React.useEffect(() => {
    const initDatabase = async () => {
      try {
        // Comprobar soporte de IndexedDB
        if (!window.indexedDB) {
          console.warn("Tu navegador no soporta IndexedDB, usando localStorage como fallback");
          setDbReady(true);
          return;
        }
        
        // Abrir/crear la base de datos
        const dbRequest = indexedDB.open(APP_NAME, 1);
        
        // Si la base de datos necesita ser creada/actualizada
        dbRequest.onupgradeneeded = (event) => {
          const db = event.target.result;
          // Crear un almacén de objetos si no existe
          if (!db.objectStoreNames.contains('userData')) {
            db.createObjectStore('userData', { keyPath: 'id' });
          }
        };
        
        // Cuando la DB esté lista
        dbRequest.onsuccess = () => {
          setDbReady(true);
        };
        
        dbRequest.onerror = (error) => {
          console.error("Error al inicializar IndexedDB:", error);
          setDbReady(true); // Continuar con localStorage como fallback
        };
      } catch (error) {
        console.error("Error crítico al configurar IndexedDB:", error);
        setDbReady(true); // Continuar con localStorage como fallback
      }
    };
    
    initDatabase();
  }, []);

  // Cargar datos guardados al iniciar
  React.useEffect(() => {
    if (!dbReady) return;
    
    const loadData = async () => {
      try {
        // Intentar cargar desde IndexedDB primero
        const data = await loadFromStorage();
        
        if (data) {
          // Verificar versión de datos
          console.log("Datos cargados con versión:", data.version, "Versión actual:", DATA_VERSION);
          
          // Cargar datos en el formulario
          setSetupPoints(data.points?.toString() || '0');
          setSetupWins(data.wins?.toString() || '0');
          setSetupLosses(data.losses?.toString() || '0');
          setSetupWinStreak(data.winStreak?.toString() || '0');
          
          // Si hay autoload, cargar los datos directamente
          if (data.autoload) {
            setPoints(data.points || 0);
            setWins(data.wins || 0);
            setLosses(data.losses || 0);
            setWinStreak(data.winStreak || 0);
            setGameHistory(data.gameHistory || []);
            setRankHistory(data.rankHistory || initRankHistory());
            setView('main');
          }
        } else {
          // Inicializar el historial de rangos si no hay datos guardados
          setRankHistory(initRankHistory());
        }
      } catch (error) {
        console.error('Error cargando datos guardados:', error);
        setErrorMessage('Error cargando datos guardados');
        // Inicializar el historial de rangos si hay error
        setRankHistory(initRankHistory());
      }
    };
    
    loadData();
  }, [dbReady]);

  // Función para cargar datos desde almacenamiento
  const loadFromStorage = async () => {
    // Intentar primero desde IndexedDB
    try {
      if (window.indexedDB) {
        return new Promise((resolve, reject) => {
          const dbRequest = indexedDB.open(APP_NAME, 1);
          
          dbRequest.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['userData'], 'readonly');
            const objectStore = transaction.objectStore('userData');
            const request = objectStore.get(IDB_KEY);
            
            request.onsuccess = () => {
              resolve(request.result ? request.result.data : null);
            };
            
            request.onerror = (error) => {
              console.warn("Error al leer de IndexedDB:", error);
              reject(error);
            };
          };
          
          dbRequest.onerror = (error) => {
            console.warn("Error al abrir IndexedDB:", error);
            reject(error);
          };
        });
      }
    } catch (error) {
      console.warn("Error con IndexedDB, intentando localStorage:", error);
    }
    
    // Fallback a localStorage
    const savedData = localStorage.getItem(`${APP_NAME}-data`);
    return savedData ? JSON.parse(savedData) : null;
  };

  // Función para guardar datos en almacenamiento
  const saveToStorage = async (data) => {
    // Intentar guardar en IndexedDB primero
    try {
      if (window.indexedDB) {
        return new Promise((resolve, reject) => {
          const dbRequest = indexedDB.open(APP_NAME, 1);
          
          dbRequest.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['userData'], 'readwrite');
            const objectStore = transaction.objectStore('userData');
            
            // Objeto a guardar con ID
            const record = {
              id: IDB_KEY,
              data: data,
              timestamp: new Date().toISOString()
            };
            
            const request = objectStore.put(record);
            
            request.onsuccess = () => {
              resolve(true);
            };
            
            request.onerror = (error) => {
              console.warn("Error al escribir en IndexedDB:", error);
              reject(error);
            };
          };
          
          dbRequest.onerror = (error) => {
            console.warn("Error al abrir IndexedDB para escritura:", error);
            reject(error);
          };
        });
      }
    } catch (error) {
      console.warn("Error con IndexedDB, usando localStorage:", error);
    }
    
    // Fallback a localStorage
    localStorage.setItem(`${APP_NAME}-data`, JSON.stringify(data));
    return true;
  };

  // Guardar datos cuando cambian
  React.useEffect(() => {
    // Solo guardar si estamos en la vista principal y la DB está lista
    if (view === 'main' && dbReady) {
      try {
        const dataToSave = {
          points,
          wins,
          losses,
          winStreak,
          gameHistory,
          rankHistory,
          autoload: true,
          lastUpdated: new Date().toISOString(),
          version: DATA_VERSION,
          appVersion: APP_CONFIG.version
        };
        
        saveToStorage(dataToSave);
      } catch (error) {
        console.error('Error guardando datos:', error);
        setErrorMessage('Error guardando datos');
      }
    }
  }, [points, wins, losses, winStreak, gameHistory, rankHistory, view, dbReady]);

  // Cálculo del rango actual basado en puntos
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

  // Generar URL para compartir datos
  const generateShareUrl = () => {
    try {
      const dataToShare = {
        p: points,
        w: wins,
        l: losses,
        s: winStreak,
        r: currentRank,
        v: DATA_VERSION
      };
      
      // Codificar los datos como un parámetro URL
      const encodedData = encodeURIComponent(JSON.stringify(dataToShare));
      
      // Crear URL con los datos
      const shareableUrl = `${window.location.origin}${window.location.pathname}?data=${encodedData}`;
      setShareUrl(shareableUrl);
      
      // Retornar para uso inmediato
      return shareableUrl;
    } catch (error) {
      console.error('Error generando URL para compartir:', error);
      setErrorMessage('Error al generar enlace para compartir');
      return null;
    }
  };

  // Función para compartir datos
  const shareData = async () => {
    try {
      const url = generateShareUrl();
      if (!url) return;
      
      // Usar API Web Share si está disponible (perfecto para iOS)
      if (navigator.share) {
        await navigator.share({
          title: 'Mis datos de Pokémon TCG Pocket',
          text: `¡Mirá mi progreso en Pokémon TCG Pocket! Estoy en ${RANKS[currentRank].name} con ${points} puntos, ${wins} victorias y ${losses} derrotas.`,
          url: url
        });
        setSuccessMessage('¡Datos compartidos!');
      } else {
        // Fallback: Copiar al portapapeles
        await navigator.clipboard.writeText(url);
        setSuccessMessage('Enlace copiado al portapapeles');
      }
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error compartiendo datos:', error);
      if (error.name !== 'AbortError') { // Ignorar si el usuario canceló
        setErrorMessage('Error al compartir datos');
        setTimeout(() => setErrorMessage(''), 5000);
      }
    }
  };

  // Extraer datos de la URL si existen
  React.useEffect(() => {
    const loadDataFromUrl = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedData = urlParams.get('data');
        
        if (encodedData) {
          const data = JSON.parse(decodeURIComponent(encodedData));
          
          // Validar versión mínima
          if (data.v && data.p !== undefined) {
            // Configurar estados
            setSetupPoints(data.p.toString());
            setSetupWins(data.w.toString());
            setSetupLosses(data.l.toString());
            setSetupWinStreak(data.s.toString());
            
            // Mostrar mensaje
            setSuccessMessage('Datos cargados desde enlace compartido');
            
            // Limpiar URL para evitar recargas con los mismos datos
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      } catch (error) {
        console.error('Error cargando datos desde URL:', error);
      }
    };
    
    if (dbReady) {
      loadDataFromUrl();
    }
  }, [dbReady]);

  // Instalar PWA
  const installPWA = async () => {
    if (!installPrompt) return;
    
    try {
      // Mostrar el prompt de instalación
      installPrompt.prompt();
      
      // Esperar a que el usuario responda
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setSuccessMessage('¡Gracias por instalar la app!');
      }
      
      // Limpiar el prompt
      setInstallPrompt(null);
    } catch (error) {
      console.error('Error al instalar PWA:', error);
    }
  };

  // Iniciar configuración
  const handleSetupSubmit = () => {
    try {
      const initialPoints = parseInt(setupPoints) || 0;
      const initialWins = parseInt(setupWins) || 0;
      const initialLosses = parseInt(setupLosses) || 0;
      const initialWinStreak = parseInt(setupWinStreak) || 0;
      
      setPoints(initialPoints);
      setWins(initialWins);
      setLosses(initialLosses);
      setWinStreak(initialWinStreak);
      
      // Reiniciar historial de partidas y rangos
      setGameHistory([]);
      setRankHistory(initRankHistory());
      
      setView('main');
      setErrorMessage('');
      
      // Actualizar almacenamiento
      const dataToSave = {
        points: initialPoints,
        wins: initialWins,
        losses: initialLosses,
        winStreak: initialWinStreak,
        gameHistory: [],
        rankHistory: initRankHistory(),
        autoload: true,
        lastUpdated: new Date().toISOString(),
        version: DATA_VERSION,
        appVersion: APP_CONFIG.version
      };
      
      saveToStorage(dataToSave);
    } catch (error) {
      console.error('Error en el setup:', error);
      setErrorMessage('Error en la configuración. Por favor intenta de nuevo.');
    }
  };

  // Exportar datos a un archivo
  const exportData = () => {
    try {
      const dataToExport = {
        points,
        wins,
        losses,
        winStreak,
        gameHistory,
        rankHistory,
        exportDate: new Date().toISOString(),
        version: DATA_VERSION,
        appVersion: APP_CONFIG.version
      };
      
      // Convertir a JSON string
      const jsonString = JSON.stringify(dataToExport, null, 2);
      
      // Para iOS, ofrecer compartir el archivo
      if (navigator.share && navigator.canShare) {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const file = new File([blob], `pokemon-tcg-data-${new Date().toISOString().slice(0,10)}.json`, {
          type: 'application/json'
        });
        
        navigator.share({
          files: [file],
          title: 'Mis datos de Pokémon TCG Pocket',
          text: 'Aquí están mis datos de Pokémon TCG Pocket.'
        }).then(() => {
          setSuccessMessage('Datos compartidos correctamente');
        }).catch((error) => {
          if (error.name !== 'AbortError') {
            console.error('Error compartiendo archivo:', error);
            // Fallback a descarga tradicional
            downloadFile(jsonString);
          }
        });
      } else {
        // Fallback para navegadores que no soportan share
        downloadFile(jsonString);
      }
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error exportando datos:', error);
      setErrorMessage('Error al exportar datos');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };
  
  // Función auxiliar para descargar archivo
  const downloadFile = (jsonString) => {
    // Crear un Blob para descargar
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Crear un enlace y simular clic para descargar
    const a = document.createElement('a');
    a.href = url;
    a.download = `pokemon-tcg-data-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Limpiar
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setSuccessMessage('Datos exportados correctamente');
  };
  
  // Importar datos desde texto
  const importData = () => {
    try {
      if (!importText.trim()) {
        setErrorMessage('No hay datos para importar');
        return;
      }
      
      const importedData = JSON.parse(importText);
      
      // Validar datos
      if (!importedData.points && importedData.points !== 0) {
        throw new Error('Datos incompletos: Falta información de puntos');
      }
      
      // Aplicar datos importados
      setPoints(importedData.points || 0);
      setWins(importedData.wins || 0);
      setLosses(importedData.losses || 0);
      setWinStreak(importedData.winStreak || 0);
      setGameHistory(importedData.gameHistory || []);
      
      // Asegurarse de que el historial de rangos tenga la estructura correcta
      const importedRankHistory = importedData.rankHistory || {};
      const updatedRankHistory = initRankHistory();
      
      // Copiar los datos del historial importado preservando la estructura
      Object.keys(updatedRankHistory).forEach(rankIdx => {
        if (importedRankHistory[rankIdx]) {
          updatedRankHistory[rankIdx].wins = importedRankHistory[rankIdx].wins || 0;
          updatedRankHistory[rankIdx].losses = importedRankHistory[rankIdx].losses || 0;
        }
      });
      
      setRankHistory(updatedRankHistory);
      
      // Guardar en almacenamiento
      const dataToSave = {
        points: importedData.points,
        wins: importedData.wins,
        losses: importedData.losses,
        winStreak: importedData.winStreak,
        gameHistory: importedData.gameHistory,
        rankHistory: updatedRankHistory,
        autoload: true,
        lastUpdated: new Date().toISOString(),
        importedFrom: importedData.exportDate,
        version: DATA_VERSION,
        appVersion: APP_CONFIG.version,
        previousVersion: importedData.version || 'desconocida'
      };
      
      saveToStorage(dataToSave);
      
      setView('main');
      setShowImportDialog(false);
      setImportText('');
      setSuccessMessage('Datos importados correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error importando datos:', error);
      setErrorMessage('Error al importar datos: ' + error.message);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  // Cargar archivo para importar
  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setImportText(e.target.result);
      } catch (error) {
        console.error('Error leyendo archivo:', error);
        setErrorMessage('Error al leer el archivo');
      }
    };
    reader.readAsText(file);
  };

  // Registrar resultado de partida
  const recordGame = (isWin) => {
    try {
      // Actualizar historial de rango actual
      const updatedRankHistory = {...rankHistory};
      if (isWin) {
        updatedRankHistory[currentRank].wins += 1;
        setWinStreak(winStreak + 1);
        setWins(wins + 1);
      } else {
        updatedRankHistory[currentRank].losses += 1;
        setWinStreak(0);
        setLosses(losses + 1);
      }
      setRankHistory(updatedRankHistory);
      
      // Calcular puntos ganados/perdidos
      let pointsChange = 0;
      if (isWin) {
        // Puntos base por victoria
        pointsChange = RANKS[currentRank].winPoints;
        
        // Bono por racha de victorias (solo hasta Great Ball Rank #4)
        if (currentRank <= 11) {
          const streakBonus = WIN_STREAK_BONUS[Math.min(winStreak, 4)];
          pointsChange += streakBonus;
        }
      } else {
        // Puntos perdidos por derrota
        pointsChange = -RANKS[currentRank].lossPoints;
      }
      
      // Actualizar puntos
      setPoints(Math.max(0, points + pointsChange));
      
      // Añadir al historial de juegos
      const gameInfo = {
        result: isWin ? 'Victoria' : 'Derrota',
        pointsChange,
        newPoints: Math.max(0, points + pointsChange),
        rankName: RANKS[currentRank].name,
        timestamp: new Date().toLocaleTimeString(),
        date: new Date().toISOString()
      };
      setGameHistory([gameInfo, ...gameHistory]);
      setErrorMessage('');
    } catch (error) {
      console.error('Error registrando partida:', error);
      setErrorMessage('Error registrando partida');
    }
  };

  // Calcular estadísticas
  const calculateWinRate = (w, l) => {
    const total = w + l;
    return total > 0 ? ((w / total) * 100).toFixed(1) : '0.0';
  };

  // Calcular Proyección por Rango
  const calculateRankProjection = (rankIndex) => {
    try {
      const rank = RANKS[rankIndex];
      const nextRankIndex = rankIndex < 16 ? rankIndex + 1 : 16;
      const nextRank = RANKS[nextRankIndex];
      
      // Si ya estamos en Master Ball, no hay siguiente rango
      if (rankIndex >= 16) return "¡Rango máximo!";
      
      // Calcular puntos necesarios para el siguiente rango
      let pointsNeeded = 0;
      if (rankIndex === currentRank) {
        // Si es el rango actual, utilizamos los puntos actuales
        pointsNeeded = nextRank.points - points;
      } else {
        // Si es otro rango, calculamos desde el inicio de ese rango
        pointsNeeded = nextRank.points - rank.points;
      }
      
      // Si es el rango actual, usar stats globales para proyección si no hay datos específicos
      const rankStats = rankHistory[rankIndex];
      const totalGames = rankStats.wins + rankStats.losses;
      
      let rankWinRate;
      if (totalGames > 0) {
        rankWinRate = rankStats.wins / totalGames;
      } else if (wins + losses > 0) {
        rankWinRate = wins / (wins + losses); // Usar global
      } else {
        rankWinRate = 0.5; // Valor por defecto
      }
      
      // Cálculo específico para el rango
      const winPoints = rank.winPoints;
      const lossPoints = rank.lossPoints;
      
      // Considerar rachas para rangos donde aplica (hasta Great Ball Rank #4)
      let effectiveWinPoints = winPoints;
      if (rankIndex <= 11) { // Hasta Great Ball Rank #4
        // Estimar bono de racha basado en winrate
        let avgStreakBonus = 0;
        if (rankWinRate > 0.8) avgStreakBonus = 9; // Aproximadamente racha de 4 (muy consistente)
        else if (rankWinRate > 0.65) avgStreakBonus = 6; // Aproximadamente racha de 3
        else if (rankWinRate > 0.5) avgStreakBonus = 3; // Aproximadamente racha de 2
        
        effectiveWinPoints += avgStreakBonus;
      }
      
      // En rangos superiores como UB4, necesitas >50% para avanzar
      const netPointsPerGame = (rankWinRate * effectiveWinPoints) - ((1 - rankWinRate) * lossPoints);
      
      if (netPointsPerGame <= 0) {
        if (rankIndex >= 12) { // Ultra Ball y superior
          // Calcular winrate mínimo para progresar
          // Para progresar: winRate*winPoints > (1-winRate)*lossPoints
          // Despejando: winRate > lossPoints/(winPoints+lossPoints)
          const requiredWinRate = (lossPoints / (winPoints + lossPoints)).toFixed(2);
          return `${pointsNeeded} pts | Necesitás >${requiredWinRate * 100}% WR`;
        }
        return `${pointsNeeded} pts | Winrate insuficiente`;
      }
      
      const estimatedGames = Math.ceil(pointsNeeded / netPointsPerGame);
      return `${pointsNeeded} pts | ~${estimatedGames} partidas`;
    } catch (error) {
      console.error('Error en proyección por rango:', error);
      return "Error en cálculo";
    }
  };
// Calcular juegos estimados hasta Master Ball
  const calculateGamesToMasterBall = () => {
    try {
      if (currentRank >= 16) return 0; // Ya está en Master Ball
      
      const pointsNeeded = RANKS[16].points - points;
      const winRate = (wins + losses > 0) ? wins / (wins + losses) : 0.5;
      
      // Vamos a calcular puntos por rangos, considerando que las rachas solo aplican hasta Great Ball Rank #4
      let gamesInRanksWithStreaks = 0;
      let gamesInRanksWithoutStreaks = 0;
      
      // Cálculo por rango
      for (let i = currentRank; i < 16; i++) {
        // Estimar puntos necesarios para subir de este rango al siguiente
        let rangePointsNeeded = 0;
        if (i === currentRank) {
          // Para el rango actual, consideramos los puntos desde la posición actual
          rangePointsNeeded = i < 16 ? RANKS[i+1].points - points : 0;
        } else {
          // Para otros rangos, es la diferencia entre ellos
          rangePointsNeeded = RANKS[i+1].points - RANKS[i].points;
        }
        
        // Estimar partidas necesarias para este rango
        const streakApplies = i <= 11; // Solo hasta Great Ball Rank #4
        
        // Puntos netos por juego en este rango
        let netPointsPerGame;
        if (streakApplies) {
          // Estimar probabilidad de rachas basadas en winrate
          // Simplificación: Asumimos un promedio de bono de racha basado en el winrate
          // A mayor winrate, mayor probabilidad de rachas largas
          let avgStreakBonus = 0;
          if (winRate > 0.8) avgStreakBonus = 9; // Aproximadamente racha de 4 (muy consistente)
          else if (winRate > 0.65) avgStreakBonus = 6; // Aproximadamente racha de 3
          else if (winRate > 0.5) avgStreakBonus = 3; // Aproximadamente racha de 2
          
          netPointsPerGame = (winRate * (RANKS[i].winPoints + avgStreakBonus)) - 
                            ((1 - winRate) * RANKS[i].lossPoints);
          
          // Estimar partidas en este rango
          const estimatedGames = netPointsPerGame > 0 
            ? Math.ceil(rangePointsNeeded / netPointsPerGame) 
            : Infinity;
            
          gamesInRanksWithStreaks += estimatedGames;
        } else {
          netPointsPerGame = (winRate * RANKS[i].winPoints) - 
                            ((1 - winRate) * RANKS[i].lossPoints);
                            
          // Estimar partidas en este rango
          const estimatedGames = netPointsPerGame > 0 
            ? Math.ceil(rangePointsNeeded / netPointsPerGame) 
            : Infinity;
            
          gamesInRanksWithoutStreaks += estimatedGames;
        }
      }
      
      // Si cualquiera de los cálculos da infinito, no se puede llegar con el winrate actual
      if (gamesInRanksWithStreaks === Infinity || gamesInRanksWithoutStreaks === Infinity) {
        return Infinity;
      }
      
      // Total de partidas estimadas
      return gamesInRanksWithStreaks + gamesInRanksWithoutStreaks;
    } catch (error) {
      console.error('Error calculando juegos hasta Master Ball:', error);
      return Infinity;
    }
  };

  // Calcular próximo rango
  const nextRank = currentRank < 16 ? currentRank + 1 : 16;
  const pointsToNextRank = currentRank < 16 ? RANKS[nextRank].points - points : 0;
  
  // Calcular bonificación actual por racha
  const currentStreakBonus = currentRank <= 11 && winStreak > 0 ? 
    WIN_STREAK_BONUS[Math.min(winStreak, 4)] : 0;

  // Renderizar pantalla de configuración inicial
  if (view === 'setup') {
    return (
      <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md flex flex-col">
        <h1 className="text-2xl font-bold text-center mb-6 text-blue-600">Pokémon TCG Pocket - Rastreador de Ranking</h1>
        
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {errorMessage}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}
        
        {!isStandalone && installPrompt && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="mb-2 text-blue-800">
              ¡Instalá esta aplicación en tu dispositivo para tener un acceso más rápido y mejorar la experiencia!
            </p>
            <button 
              onClick={installPWA} 
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Instalar App
            </button>
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Puntos actuales:</label>
            <input 
              type="number" 
              value={setupPoints} 
              onChange={(e) => setSetupPoints(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="0"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Victorias:</label>
            <input 
              type="number" 
              value={setupWins} 
              onChange={(e) => setSetupWins(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="0"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Derrotas:</label>
            <input 
              type="number" 
              value={setupLosses} 
              onChange={(e) => setSetupLosses(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="0"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Racha actual de victorias:</label>
            <input 
              type="number" 
              value={setupWinStreak} 
              onChange={(e) => setSetupWinStreak(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="0"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Importante para cálculo correcto de bonos</p>
          </div>
          
          <button 
            onClick={handleSetupSubmit} 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Comenzar Seguimiento
          </button>
          
          <div className="mt-4 border-t pt-4">
            <p className="text-gray-700 font-medium mb-2">¿Ya tenés datos guardados?</p>
            <button 
              onClick={() => setShowImportDialog(true)} 
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
            >
              <Upload size={20} className="mr-2" />
              Importar Datos
            </button>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">Una vez en la vista principal podrás exportar tus datos</p>
          <p className="text-xs text-gray-400 mt-2">Versión {APP_CONFIG.version}</p>
        </div>
        
        {/* Modal de Importación */}
        {showImportDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Importar Datos</h2>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Sube un archivo JSON exportado previamente</p>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleFileImport}
                  className="w-full border p-2 rounded"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">O pega el contenido del archivo:</label>
                <textarea 
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full p-2 border rounded h-32"
                  placeholder='{"points": 0, "wins": 0, ...}'
                />
              </div>
              
              <div className="flex space-x-2">
                <button 
                  onClick={importData} 
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                >
                  Importar
                </button>
                <button 
                  onClick={() => {
                    setShowImportDialog(false);
                    setImportText('');
                  }} 
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Vista principal
  return (
    <div className="p-4 max-w-2xl mx-auto bg-gray-50 min-h-screen">
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-md p-6 mb-4">
        <h1 className="text-2xl font-bold text-center mb-4 text-blue-600">Pokémon TCG Pocket - Tracker</h1>
        
        {/* Botones de Exportación y Compartir */}
        <div className="flex justify-end mb-4">
          <button 
            onClick={shareData} 
            className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
          >
            <Share2 size={18} className="mr-1" />
            Compartir
          </button>
          <button 
            onClick={exportData} 
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <Download size={18} className="mr-1" />
            Exportar
          </button>
        </div>
        
        {/* Estado actual */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <h2 className="text-lg font-semibold mb-2">Rango Actual</h2>
            <div className="text-xl font-bold text-blue-700">{RANKS[currentRank].name}</div>
            <div className="mt-2 text-sm text-gray-500">
              {pointsToNextRank > 0 ? 
                `${pointsToNextRank} puntos para ${RANKS[nextRank].name}` : 
                "¡Rango máximo alcanzado!"}
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <h2 className="text-lg font-semibold mb-2">Puntos</h2>
            <div className="text-xl font-bold text-blue-700">{points}</div>
            <div className="mt-2 text-sm text-gray-500">
              {winStreak > 0 && currentRank <= 11 ? 
                `Racha: ${winStreak} ${winStreak >= 5 ? '(máx)' : ''} (+${currentStreakBonus} puntos)` : ''}
            </div>
          </div>
        </div>
        
        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <h3 className="text-sm font-semibold mb-1">Victorias</h3>
            <div className="text-lg font-bold text-green-600">{wins}</div>
          </div>
          
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <h3 className="text-sm font-semibold mb-1">Derrotas</h3>
            <div className="text-lg font-bold text-red-600">{losses}</div>
          </div>
          
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <h3 className="text-sm font-semibold mb-1">Winrate</h3>
            <div className="text-lg font-bold text-purple-600">{calculateWinRate(wins, losses)}%</div>
          </div>
        </div>
        
        {/* Master Ball Projection */}
        <div className="bg-yellow-50 p-4 rounded-lg text-center mb-6">
          <h2 className="text-lg font-semibold mb-2">Proyección Master Ball</h2>
          <div className="text-xl font-bold text-yellow-600">
            {calculateGamesToMasterBall() === Infinity 
              ? "Necesitás mejorar tu winrate" 
              : `~${calculateGamesToMasterBall()} partidas restantes`}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Con tu winrate actual de {calculateWinRate(wins, losses)}%
          </div>
        </div>
        
        {/* Registrar partida */}
        <div className="flex space-x-2 mb-6">
          <button 
            onClick={() => recordGame(true)} 
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded flex items-center justify-center"
          >
            <ChevronUp size={20} className="mr-2" />
            Victoria
          </button>
          
          <button 
            onClick={() => recordGame(false)} 
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded flex items-center justify-center"
          >
            <ChevronDown size={20} className="mr-2" />
            Derrota
          </button>
        </div>
      </div>
      
      {/* Historial de Partidas */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-4">
        <h2 className="text-xl font-bold mb-4">Historial de Partidas</h2>
        
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {gameHistory.length > 0 ? (
            gameHistory.map((game, idx) => (
              <div key={idx} className={`p-3 rounded-lg ${game.result === 'Victoria' ? 'bg-green-50' : 'bg-red-50'} flex justify-between`}>
                <div>
                  <span className={`font-semibold ${game.result === 'Victoria' ? 'text-green-600' : 'text-red-600'}`}>
                    {game.result}
                  </span>
                  <span className="text-gray-500 ml-2">{game.rankName}</span>
                </div>
                <div>
                  <span className={`font-semibold ${game.pointsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {game.pointsChange >= 0 ? '+' : ''}{game.pointsChange}
                  </span>
                  <span className="text-gray-500 ml-2">{game.timestamp}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500">No hay partidas registradas</div>
          )}
        </div>
      </div>
      
      {/* Estadísticas por Rango */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Rendimiento por Rango</h2>
        
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {Object.entries(rankHistory).map(([rankIdx, stats]) => {
            const rank = RANKS[parseInt(rankIdx)];
            const totalGames = stats.wins + stats.losses;
            if (totalGames === 0) return null;
            
            const winRate = calculateWinRate(stats.wins, stats.losses);
            
            return (
              <div key={rankIdx} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <div className="font-medium">{rank.name}</div>
                  <div className="text-sm">
                    <span className="text-green-600 font-medium">{stats.wins}W</span>
                    <span className="mx-1">-</span>
                    <span className="text-red-600 font-medium">{stats.losses}L</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${winRate}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Winrate: {winRate}%</span>
                  <span className="font-medium">
                    {calculateRankProjection(parseInt(rankIdx))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Botón de reset y opciones */}
      <div className="mt-4 text-center">
        <div className="flex justify-center space-x-4">
          <button 
            onClick={() => setView('setup')} 
            className="text-blue-500 hover:text-blue-700 text-sm"
          >
            Editar configuración
          </button>
          
          <button 
            onClick={() => {
              setShowImportDialog(true);
            }}
            className="text-green-500 hover:text-green-700 text-sm"
          >
            Importar datos
          </button>
          
          <button 
            onClick={() => {
              // Confirmar borrado
              const confirmReset = window.confirm('¿Estás seguro que querés borrar todos los datos? Esta acción no se puede deshacer.');
              if (confirmReset) {
                // Intentar borrar de IndexedDB
                if (window.indexedDB) {
                  const request = indexedDB.deleteDatabase(APP_NAME);
                  request.onsuccess = () => {
                    console.log("Base de datos eliminada correctamente");
                  };
                }
                // Borrar también de localStorage
                localStorage.clear();
                // Recargar
                window.location.reload();
              }
            }} 
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Borrar datos
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Tus datos se guardan automáticamente</p>
        <p className="text-xs text-gray-400 mt-1">Versión {APP_CONFIG.version}</p>
      </div>
      
      {/* Modal de Importación */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Importar Datos</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Sube un archivo JSON exportado previamente</p>
              <input 
                type="file" 
                accept=".json" 
                onChange={handleFileImport}
                className="w-full border p-2 rounded"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">O pega el contenido del archivo:</label>
              <textarea 
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full p-2 border rounded h-32"
                placeholder='{"points": 0, "wins": 0, ...}'
              />
            </div>
            
            <div className="flex space-x-2">
              <button 
                onClick={importData} 
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                disabled={!importText.trim()}
              >
                Importar
              </button>
              <button 
                onClick={() => {
                  setShowImportDialog(false);
                  setImportText('');
                }} 
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Renderizar el componente en el DOM
ReactDOM.render(<PokemonTCGRankTracker />, document.getElementById('root'));
