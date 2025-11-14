
import React, { useState, FormEvent, useEffect, useRef } from 'react';

enum GameStage {
  START,
  KNOWLEDGE,
  CONQUER,
  DRAG_PUZZLE,
  FINAL_CARD,
}

interface StageContent {
  key: string;
  element: React.ReactElement;
}

const CACHE_KEY = 'paranormalEnigmaStage';
const MUTE_CACHE_KEY = 'paranormalEnigmaMuted';

const STAGE_MUSIC: Partial<Record<GameStage, string>> = {
  [GameStage.START]: 'https://files.catbox.moe/kd3ohd.mp3',
  [GameStage.KNOWLEDGE]: 'https://files.catbox.moe/hbr9sy.mp3',
  [GameStage.CONQUER]: 'https://files.catbox.moe/6z95to.mp3',
  [GameStage.DRAG_PUZZLE]: 'https://files.catbox.moe/f41jkw.mp3',
  [GameStage.FINAL_CARD]: 'https://files.catbox.moe/h101xx.mp3',
};

const getInitialStage = (): GameStage => {
  try {
    const savedStage = localStorage.getItem(CACHE_KEY);
    if (savedStage) {
      const parsedStage = parseInt(savedStage, 10);
      if (!isNaN(parsedStage) && GameStage[parsedStage] !== undefined) {
        return parsedStage as GameStage;
      }
    }
  } catch (error) {
    console.error("Failed to read stage from localStorage", error);
  }
  return GameStage.START;
};

const getInitialMuteState = (): boolean => {
    try {
        const savedMuteState = localStorage.getItem(MUTE_CACHE_KEY);
        return savedMuteState ? JSON.parse(savedMuteState) : false;
    } catch (error) {
        console.error("Failed to read mute state from localStorage", error);
        return false;
    }
};

interface EnigmaImageProps {
  src: string;
  alt: string;
  downloadName: string;
}

const EnigmaImage: React.FC<EnigmaImageProps> = ({ src, alt, downloadName }) => (
  <div className="relative">
    <img src={src} alt={alt} className="max-w-xs md:max-w-sm w-full object-contain shadow-lg shadow-red-900/50" />
    <a
      href={src}
      download={downloadName}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fazer download da imagem"
      title="Fazer Download"
      className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 rounded-full text-red-700 hover:bg-opacity-75 hover:text-red-500 transition-colors z-10"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    </a>
  </div>
);

const DragPuzzle: React.FC<{ onSolve: () => void }> = ({ onSolve }) => {
    const INITIAL_WORDS = useRef(['CONHECIMENTO', 'CONQUISTAR', 'BUSQUE'].sort(() => Math.random() - 0.5)).current;
    const CORRECT_SEQUENCE = 'BUSQUE CONQUISTAR CONHECIMENTO';

    const [draggableWords, setDraggableWords] = useState<string[]>(INITIAL_WORDS);
    const [droppedWords, setDroppedWords] = useState<Array<string | null>>([null, null, null]);
    const [error, setError] = useState<string | null>(null);
    const [selectedWord, setSelectedWord] = useState<string | null>(null);

    const checkSequence = (sequence: Array<string | null>) => {
        if (sequence.every(word => word !== null)) {
            if (sequence.join(' ').toUpperCase() === CORRECT_SEQUENCE) {
                setError(null);
                setTimeout(onSolve, 1000);
            } else {
                setError("A sequência está incorreta. As palavras retornam ao caos.");
                setTimeout(() => {
                    setDraggableWords(INITIAL_WORDS);
                    setDroppedWords([null, null, null]);
                    setError(null);
                }, 2000);
            }
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, word: string) => {
        e.dataTransfer.setData("text/plain", word);
        e.currentTarget.classList.add('opacity-40');
        setSelectedWord(null);
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('opacity-40');
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.add('bg-yellow-500/20');
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('bg-yellow-500/20');
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, slotIndex: number) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-yellow-500/20');
        const word = e.dataTransfer.getData("text/plain");

        if (!draggableWords.includes(word) || droppedWords[slotIndex] !== null) return;

        const newDroppedWords = [...droppedWords];
        newDroppedWords[slotIndex] = word;
        setDroppedWords(newDroppedWords);

        const newDraggableWords = draggableWords.filter(w => w !== word);
        setDraggableWords(newDraggableWords);

        checkSequence(newDroppedWords);
    };

    const handleWordClick = (word: string) => {
        setSelectedWord(current => (current === word ? null : word));
    };

    const handleSlotClick = (slotIndex: number) => {
        if (selectedWord && !droppedWords[slotIndex]) {
            const newDroppedWords = [...droppedWords];
            newDroppedWords[slotIndex] = selectedWord;
            setDroppedWords(newDroppedWords);

            const newDraggableWords = draggableWords.filter(w => w !== selectedWord);
            setDraggableWords(newDraggableWords);
            setSelectedWord(null);
            checkSequence(newDroppedWords);
        }
        else if (droppedWords[slotIndex]) {
            const wordToReturn = droppedWords[slotIndex] as string;
            const newDroppedWords = [...droppedWords];
            newDroppedWords[slotIndex] = null;
            setDroppedWords(newDroppedWords);
            setDraggableWords(current => [...current, wordToReturn]);
            setSelectedWord(null);
        }
    };

    return (
        <div className="flex flex-col items-center gap-8 w-full text-yellow-400">
            <p className="text-center text-lg">Revele a frase oculta nas centelhas de conhecimento que já lhe foram dadas.</p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                {droppedWords.map((word, index) => (
                    <div
                        key={index}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        onClick={() => handleSlotClick(index)}
                        className={`w-full sm:w-1/3 h-16 border-2 border-dashed border-yellow-700 flex items-center justify-center text-yellow-300 text-lg font-bold tracking-widest transition-all duration-200 ${(word || selectedWord) ? 'cursor-pointer' : ''}`}
                    >
                        {word}
                    </div>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-4">
                 {draggableWords.map((word) => (
                    <div
                        key={word}
                        draggable
                        onDragStart={(e) => handleDragStart(e, word)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleWordClick(word)}
                        className={`w-full sm:w-1/3 h-16 border-2 bg-black flex items-center justify-center text-yellow-500 text-lg font-bold tracking-widest cursor-pointer md:cursor-grab active:cursor-grabbing transition-all duration-200 ${selectedWord === word ? 'border-yellow-300 scale-105 shadow-lg shadow-yellow-500/30' : 'border-yellow-600'}`}
                    >
                        {word}
                    </div>
                 ))}
            </div>
             {error && (
                <div className="text-center text-lg mt-2 text-yellow-500 animate-pulse">
                    <p>{error}</p>
                </div>
            )}
        </div>
    );
};

const FinalCard: React.FC = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const ROTATION_FACTOR = 10;
  const cardImageUrl = "https://i.ibb.co/7c44QNh/Cart-o-Final.jpg";
  const initialOrientation = useRef<{ beta: number | null, gamma: number | null }>({ beta: null, gamma: null });

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    
    let hasGyro = false;

    const handleMouseMove = (e: MouseEvent) => {
      const { width, height, left, top } = card.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;

      const rotateY = ROTATION_FACTOR * ((x - width / 2) / (width / 2));
      const rotateX = -ROTATION_FACTOR * ((y - height / 2) / (height / 2));
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    };

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    };

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      const { beta, gamma } = event;
      if (gamma === null || beta === null) return;
      
      hasGyro = true;
      
      // Capture initial orientation on first event
      if (initialOrientation.current.beta === null) {
        initialOrientation.current.beta = beta;
      }
      if (initialOrientation.current.gamma === null) {
        initialOrientation.current.gamma = gamma;
      }

      // Calculate relative movement from initial orientation
      const relativeBeta = beta - (initialOrientation.current.beta || 0);
      const relativeGamma = gamma - (initialOrientation.current.gamma || 0);
      
      // Invert both for mirrored effect
      const rotateY = Math.max(-20, Math.min(20, -(relativeGamma * 0.5))); 
      const rotateX = Math.max(-20, Math.min(20, -(relativeBeta * 0.5)));

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    };
    
    const handleMouseMoveWithGyroCheck = (e: MouseEvent) => {
      if (!hasGyro) {
        handleMouseMove(e);
      }
    };

    if (window.DeviceOrientationEvent) {
       window.addEventListener('deviceorientation', handleDeviceOrientation, true);
    }
    
    card.addEventListener('mousemove', handleMouseMoveWithGyroCheck);
    card.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      card.removeEventListener('mousemove', handleMouseMoveWithGyroCheck);
      card.removeEventListener('mouseleave', handleMouseLeave);
      if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleDeviceOrientation, true);
      }
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className="relative w-full max-w-lg aspect-[2000/1111] transition-transform duration-100 ease-out will-change-transform"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <img
        src={cardImageUrl}
        alt="Cartão Final - Ordo Realitas"
        className="w-full h-full object-cover rounded-lg shadow-2xl shadow-red-900/60 pointer-events-none"
      />
       <a
        href={cardImageUrl}
        download="Cartao-Final-Ordo-Realitas.jpg"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Fazer download da imagem"
        title="Fazer Download"
        className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 rounded-full text-red-700 hover:bg-opacity-75 hover:text-red-500 transition-colors z-10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </a>
    </div>
  );
};


const App: React.FC = () => {
  const [stage, setStage] = useState<GameStage>(getInitialStage());
  const [inputValue, setInputValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [content, setContent] = useState<StageContent | null>(null);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(getInitialMuteState());
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const STAGES_DATA: Record<GameStage, { prompt: string, correctAnswer: string, nextStage: GameStage }> = {
    [GameStage.START]: { prompt: "ILUMINE sua mente e veja os REFLEXOS de suas ações… digite o que descobriu.", correctAnswer: "CONHECIMENTO", nextStage: GameStage.KNOWLEDGE },
    [GameStage.KNOWLEDGE]: { prompt: "Conecte-se ao Outro Lado e entenda suas mensagens.", correctAnswer: "CONQUISTAR", nextStage: GameStage.CONQUER },
    [GameStage.CONQUER]: { prompt: "O fim é próximo e inevitável, mas você percebe a presença do vazio?", correctAnswer: "BUSQUE", nextStage: GameStage.DRAG_PUZZLE },
    [GameStage.DRAG_PUZZLE]: { prompt: "Revele a frase oculta nas centelhas de conhecimento que já lhe foram dadas.", correctAnswer: "", nextStage: GameStage.FINAL_CARD },
    [GameStage.FINAL_CARD]: { prompt: "Você se provou um bom agente, contate o Oficial de Operações Rafael M. para receber sua recompensa", correctAnswer: "", nextStage: GameStage.FINAL_CARD },
  };

  useEffect(() => {
    try {
      localStorage.setItem(CACHE_KEY, stage.toString());
    } catch (error) {
      console.error("Failed to write stage to localStorage", error);
    }
  }, [stage]);

  useEffect(() => {
    try {
        localStorage.setItem(MUTE_CACHE_KEY, JSON.stringify(isMuted));
    } catch (error) {
        console.error("Failed to write mute state to localStorage", error);
    }
  }, [isMuted]);

  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
      }
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [hasInteracted]);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    audioEl.volume = 0.3;
    audioEl.muted = isMuted;

    const musicSrc = STAGE_MUSIC[stage];

    if (musicSrc) {
      if (audioEl.src !== musicSrc) {
        audioEl.src = musicSrc;
        audioEl.load();
      }
      if (hasInteracted && audioEl.paused) {
        const playPromise = audioEl.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn("A reprodução de áudio foi bloqueada pelo navegador.", error);
          });
        }
      }
    } else {
      audioEl.pause();
      audioEl.src = '';
    }
  }, [stage, hasInteracted, isMuted]);


  useEffect(() => {
    const generateContent = () => {
      switch (stage) {
        case GameStage.START:
          return {
            key: 'start',
            element: (
              <div className="flex flex-col items-center gap-6">
                <EnigmaImage src="https://i.ibb.co/8gwtDkXc/Primeiro-Sinal.jpg" alt="Primeiro Sinal" downloadName="Primeiro-Sinal.jpg" />
                <p className="text-center text-lg">{STAGES_DATA[GameStage.START].prompt}</p>
              </div>
            ),
          };
        case GameStage.KNOWLEDGE:
          return {
            key: 'knowledge',
            element: (
              <div className="flex flex-col items-center gap-6">
                <EnigmaImage src="https://i.ibb.co/wrPYnq94/Segundo-Sinal.jpg" alt="Segundo Sinal" downloadName="Segundo-Sinal.jpg" />
                <p className="text-center text-lg">{STAGES_DATA[GameStage.KNOWLEDGE].prompt}</p>
              </div>
            ),
          };
        case GameStage.CONQUER:
          return {
            key: 'conquer',
            element: (
              <div className="flex flex-col items-center gap-6">
                 <EnigmaImage src="https://i.ibb.co/Y448pdsD/Terceiro-Sinal.jpg" alt="Terceiro Sinal" downloadName="Terceiro-Sinal.jpg" />
                <p className="text-center text-lg">{STAGES_DATA[GameStage.CONQUER].prompt}</p>
              </div>
            ),
          };
        case GameStage.DRAG_PUZZLE:
           return {
            key: 'drag_puzzle',
            element: <DragPuzzle onSolve={() => setStage(GameStage.FINAL_CARD)} />,
          };
        case GameStage.FINAL_CARD:
           return {
            key: 'final_card',
            element: (
                <div className="flex flex-col items-center gap-8">
                    <p className="text-center text-xl font-bold">{STAGES_DATA[GameStage.FINAL_CARD].prompt}</p>
                    <FinalCard />
                </div>
            ),
          };
        default:
          return { key: 'default', element: <></> };
      }
    };
    
    setIsLoading(true);
    setTimeout(() => {
      setContent(generateContent());
      setIsLoading(false);
      if (stage < GameStage.DRAG_PUZZLE) {
         inputRef.current?.focus();
      }
    }, 500);
  }, [stage]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isLoading || stage >= GameStage.DRAG_PUZZLE) return;
    
    if (!hasInteracted) {
        setHasInteracted(true);
    }

    const formattedInput = inputValue.trim().toUpperCase();

    if (formattedInput === '0413') {
      try {
        localStorage.removeItem(CACHE_KEY);
        window.location.reload();
      } catch (error) {
        console.error("Failed to remove from localStorage", error);
        setError("Não foi possível apagar o progresso.");
      }
      return;
    }
    
    const currentStageData = STAGES_DATA[stage];
    
    if (formattedInput === currentStageData.correctAnswer) {
      setError(null);
      setStage(currentStageData.nextStage);
    } else {
      setError("As palavras erradas ecoam no vazio. Há algo que você ainda não compreendeu…");
    }
    setInputValue('');
  };

  return (
    <div className="bg-black text-red-700 min-h-screen w-full flex flex-col items-center justify-between p-4 sm:p-8 selection:bg-red-900 selection:text-white relative">
      {stage < GameStage.DRAG_PUZZLE && (
        <header className="w-full text-center py-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-widest">Registros do Outro Lado</h1>
        </header>
      )}

      <main className="flex-grow flex flex-col items-center justify-center w-full max-w-2xl px-4">
        <div className={`transition-opacity duration-1000 ease-in-out w-full flex justify-center ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
          {content?.element}
        </div>
        
        {error && (
            <div className={`text-center text-lg mt-6 animate-pulse ${stage === GameStage.DRAG_PUZZLE ? 'text-yellow-500' : 'text-red-700'}`}>
                <p>{error}</p>
            </div>
        )}
      </main>

      <footer className="w-full py-4 max-w-lg">
        {stage < GameStage.DRAG_PUZZLE && (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4 w-full">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Digite sua resposta..."
              disabled={isLoading}
              className="w-full sm:flex-grow bg-transparent border-b-2 border-red-800 text-red-500 text-center text-lg placeholder-red-900 focus:outline-none focus:border-red-500 focus:placeholder-red-700 transition-all duration-300 py-2"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-10 py-3 bg-transparent border-2 border-red-800 text-red-700 hover:bg-red-800 hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-red-500 transition-all duration-300 font-bold tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Enviar
            </button>
          </form>
        )}
      </footer>
      <audio ref={audioRef} loop preload="auto" />
      <button
        onClick={() => setIsMuted(!isMuted)}
        className="absolute bottom-4 right-4 p-2 text-red-900 hover:text-red-500 transition-colors z-20"
        aria-label={isMuted ? "Ativar som" : "Desativar som"}
        title={isMuted ? "Ativar som" : "Desativar som"}
      >
        {isMuted ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default App;
