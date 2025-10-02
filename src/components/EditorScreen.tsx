import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generatePdf } from '../services/pdfService';
import { getCrossStitchInstructions } from '../services/geminiService';
import Spinner from './Spinner';
import { DownloadIcon, CircleIcon, SquareIcon, SaveIcon, BackIcon, UndoIcon, RedoIcon, SvgFileIcon } from './Icons';
import { DmcColor, SavedPattern } from '../types';

interface EditorScreenProps {
  imageFile: File;
  initialState: SavedPattern | null;
  onBack: () => void;
}

type FillShape = 'circle' | 'square';

type EditorState = {
  gridSize: number;
  threshold: number;
  fillShape: FillShape;
  outlineOffset: number;
  selectedColor: DmcColor;
};


const DMC_COLORS: DmcColor[] = [
  { name: 'Red', dmc: '#321', hex: '#DE313A' },
  { name: 'Bright Orange', dmc: '#608', hex: '#FF6C00' },
  { name: 'Dark Lemon', dmc: '#444', hex: '#FFBF00' },
  { name: 'Green', dmc: '#699', hex: '#008848' },
  { name: 'Dark Delft Blue', dmc: '#798', hex: '#40548B' },
  { name: 'Black', dmc: '#310', hex: '#000000' },
];

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
};

const EditorScreen: React.FC<EditorScreenProps> = ({ imageFile, initialState, onBack }) => {
  const [history, setHistory] = useState<EditorState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [stitchGrid, setStitchGrid] = useState<boolean[][] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Preparing image...');
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const patternCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(new Image());

  const currentState = history[historyIndex];
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  
  const setState = (newState: Partial<EditorState>) => {
    const nextState = { ...currentState, ...newState };
     if (JSON.stringify(nextState) === JSON.stringify(currentState)) {
        return;
    }
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(nextState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  useEffect(() => {
    const defaultState: EditorState = {
      gridSize: 32,
      threshold: 128,
      fillShape: 'circle',
      outlineOffset: 0,
      selectedColor: DMC_COLORS[5],
    };

    const loadedState: EditorState = initialState ? {
        gridSize: initialState.gridSize,
        threshold: initialState.threshold,
        fillShape: initialState.fillShape,
        outlineOffset: initialState.outlineOffset,
        selectedColor: DMC_COLORS.find(c => c.dmc === initialState.selectedColor?.dmc) || DMC_COLORS[5],
    } : defaultState;

    setHistory([loadedState]);
    setHistoryIndex(0);
  }, [initialState]);


  useEffect(() => {
    // Guard against running before everything is ready
    if (!isImageLoaded || !imageRef.current.complete || !currentState || !patternCanvasRef.current) {
      return;
    }
    setLoading(true);
    setLoadingMessage('Generating pattern...');
    
    requestAnimationFrame(() => {
      const { gridSize, threshold, fillShape, outlineOffset, selectedColor } = currentState;
      const image = imageRef.current;
      const canvas = patternCanvasRef.current;
      if (!canvas) {
        setLoading(false);
        return;
      }
      
      const container = canvas.parentElement;
      if (!container) return;
      
      const aspectRatio = image.width / image.height;
      const canvasWidth = container.clientWidth;
      canvas.width = canvasWidth;
      canvas.height = canvasWidth / aspectRatio;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const stitchesX = gridSize;
      const stitchesY = Math.floor(gridSize / aspectRatio);
      
      const smallCanvas = document.createElement('canvas');
      smallCanvas.width = stitchesX;
      smallCanvas.height = stitchesY;
      const smallCtx = smallCanvas.getContext('2d', { willReadFrequently: true });
      if (!smallCtx) return;

      smallCtx.imageSmoothingEnabled = true;
      smallCtx.imageSmoothingQuality = 'high';
      smallCtx.drawImage(image, 0, 0, stitchesX, stitchesY);

      const imageData = smallCtx.getImageData(0, 0, stitchesX, stitchesY).data;
      
      const currentStitchGrid: boolean[][] = Array.from({ length: stitchesY }, () => Array(stitchesX).fill(false));
      for (let y = 0; y < stitchesY; y++) {
        for (let x = 0; x < stitchesX; x++) {
          const i = (y * stitchesX + x) * 4;
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const a = imageData[i + 3];
          const gray = r * 0.299 + g * 0.587 + b * 0.114;
          if (a > 128 && gray < threshold) {
            currentStitchGrid[y][x] = true;
          }
        }
      }
      setStitchGrid(currentStitchGrid);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const stitchWidth = canvas.width / stitchesX;
      const stitchHeight = canvas.height / stitchesY;
      
      if (outlineOffset > 0) {
        const backgroundGrid = getBackgroundGrid(currentStitchGrid, stitchesX, stitchesY);
        const contourPaths = traceAndSimplifyContours(currentStitchGrid, backgroundGrid, stitchesX, stitchesY);

        const path2DObjects = contourPaths.map(path => {
          const p = new Path2D();
          if (path.length < 2) return p;
          const start = path[0];
          p.moveTo(start[0] * stitchWidth, start[1] * stitchHeight);
          for (let i = 1; i < path.length; i++) {
              const point = path[i];
              p.lineTo(point[0] * stitchWidth, point[1] * stitchHeight);
          }
          p.closePath();
          return p;
        });

        ctx.strokeStyle = selectedColor.hex;
        ctx.lineWidth = outlineOffset * 2;
        ctx.lineJoin = 'miter';
        ctx.miterLimit = 4;
        path2DObjects.forEach(p => ctx.stroke(p));
      }
      
      ctx.fillStyle = selectedColor.hex;
      const stitchSize = Math.min(stitchWidth, stitchHeight);
      const circleRadius = stitchSize / 3.0;
      const squareSize = stitchSize * 2 / 3.0;

      for (let y = 0; y < stitchesY; y++) {
        for (let x = 0; x < stitchesX; x++) {
          if (currentStitchGrid[y][x]) {
            if (fillShape === 'circle') {
              ctx.beginPath();
              ctx.arc(x * stitchWidth + stitchWidth / 2, y * stitchHeight + stitchHeight / 2, circleRadius, 0, 2 * Math.PI, false);
              ctx.fill();
            } else {
              const rectX = x * stitchWidth + (stitchWidth - squareSize) / 2;
              const rectY = y * stitchHeight + (stitchHeight - squareSize) / 2;
              ctx.fillRect(rectX, rectY, squareSize, squareSize);
            }
          }
        }
      }
      setLoading(false);
    });
  }, [isImageLoaded, currentState]);

  useEffect(() => {
    setLoading(true);
    setLoadingMessage('Preparing image...');
    setIsImageLoaded(false);
    const img = imageRef.current;
    let objectUrl: string | null = null;
    const handleImageLoad = () => setIsImageLoaded(true);
    img.addEventListener('load', handleImageLoad);
    img.onerror = () => { alert("Failed to load image."); setLoading(false); };

    if (imageFile) {
        objectUrl = URL.createObjectURL(imageFile);
        img.src = objectUrl;
    }
    return () => {
        img.removeEventListener('load', handleImageLoad);
        img.onerror = null;
        img.src = '';
        if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

   useEffect(() => {
    setSaveStatus('idle');
  }, [currentState]);

  const handleSavePattern = async () => {
    if (!patternCanvasRef.current || !imageFile || !currentState) {
      alert("Cannot save, pattern not ready.");
      return;
    }
    setSaveStatus('saving');
    try {
      const originalImageDataUrl = await fileToDataUrl(imageFile);
      const previewDataUrl = patternCanvasRef.current.toDataURL('image/jpeg', 0.8);
      
      const newPattern: SavedPattern = {
        id: initialState?.id || Date.now().toString(),
        createdAt: initialState?.createdAt || Date.now(),
        previewDataUrl,
        originalImageDataUrl,
        ...currentState
      };
      
      const savedPatternsRaw = localStorage.getItem('myPatterns');
      let patterns: SavedPattern[] = savedPatternsRaw ? JSON.parse(savedPatternsRaw) : [];
      
      const existingIndex = patterns.findIndex(p => p.id === newPattern.id);
      if (existingIndex > -1) {
          patterns[existingIndex] = newPattern;
      } else {
          patterns.unshift(newPattern);
      }

      localStorage.setItem('myPatterns', JSON.stringify(patterns));
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error("Failed to save pattern:", error);
      alert("Could not save the pattern. Your browser's storage might be full.");
      setSaveStatus('idle');
    }
  };

  const handleDownloadPdfWithInstructions = async () => {
    if (patternCanvasRef.current && imageRef.current.complete && currentState) {
      setLoading(true);
      const savedThreadCount = localStorage.getItem('settings:threadCount');
      const threadCount = savedThreadCount ? JSON.parse(savedThreadCount) : '14-count';
      const image = imageRef.current;
      const aspectRatio = image.width / image.height;
      const stitchesX = currentState.gridSize;
      const stitchesY = Math.floor(currentState.gridSize / aspectRatio);

      setLoadingMessage('Generating instructions...');
      let instructions = 'Failed to generate instructions.';
      try {
        instructions = await getCrossStitchInstructions(stitchesX, stitchesY, threadCount, currentState.selectedColor.name, currentState.selectedColor.dmc);
      } catch (e) {
        console.error(e);
        alert('There was an issue generating the stitching instructions. The PDF will be created without them.');
      }
      
      setLoadingMessage('Creating PDF...');
      await generatePdf(patternCanvasRef.current, instructions, stitchesX, stitchesY);
      setLoading(false);
    }
  };
  
  const handleDownloadPdfWithoutInstructions = async () => {
    if (patternCanvasRef.current && imageRef.current.complete && currentState) {
        setLoading(true);
        setLoadingMessage('Creating PDF...');
        const image = imageRef.current;
        const aspectRatio = image.width / image.height;
        const stitchesX = currentState.gridSize;
        const stitchesY = Math.floor(currentState.gridSize / aspectRatio);
        await generatePdf(patternCanvasRef.current, '', stitchesX, stitchesY);
        setLoading(false);
    }
  };
  
  const handleDownloadSvg = () => {
    if (!stitchGrid || !currentState || !imageRef.current.complete) {
      alert("Pattern is not ready to be downloaded as SVG.");
      return;
    }

    const { fillShape, selectedColor, outlineOffset, gridSize } = currentState;
    const image = imageRef.current;
    const aspectRatio = image.width / image.height;
    const stitchesX = gridSize;
    const stitchesY = Math.floor(gridSize / aspectRatio);
    
    const stitchSize = 10; // SVG base unit size
    const width = stitchesX * stitchSize;
    const height = stitchesY * stitchSize;
    
    let svgElements = '';

    // Generate outline path
    if (outlineOffset > 0) {
      const backgroundGrid = getBackgroundGrid(stitchGrid, stitchesX, stitchesY);
      const contourPaths = traceAndSimplifyContours(stitchGrid, backgroundGrid, stitchesX, stitchesY);

      contourPaths.forEach(path => {
        if (path.length < 2) return;
        const d = path.map((point, index) => {
          const [x, y] = point;
          const command = index === 0 ? 'M' : 'L';
          return `${command} ${x * stitchSize} ${y * stitchSize}`;
        }).join(' ');
        
        svgElements += `<path d="${d} Z" stroke="${selectedColor.hex}" stroke-width="${outlineOffset * 2}" stroke-linejoin="round" fill="none" />`;
      });
    }

    // Generate fill shapes
    const circleRadius = stitchSize / 3.0;
    const squareSize = stitchSize * 2 / 3.0;

    for (let y = 0; y < stitchesY; y++) {
      for (let x = 0; x < stitchesX; x++) {
        if (stitchGrid[y][x]) {
          const centerX = x * stitchSize + stitchSize / 2;
          const centerY = y * stitchSize + stitchSize / 2;
          if (fillShape === 'circle') {
            svgElements += `<circle cx="${centerX}" cy="${centerY}" r="${circleRadius}" fill="${selectedColor.hex}" />`;
          } else { // square
            const rectX = centerX - squareSize / 2;
            const rectY = centerY - squareSize / 2;
            svgElements += `<rect x="${rectX}" y="${rectY}" width="${squareSize}" height="${squareSize}" fill="${selectedColor.hex}" />`;
          }
        }
      }
    }

    const svgString = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${svgElements}</svg>`;
    
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cross-stitch-pattern.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!currentState) {
    return (
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 rounded-xl">
          <Spinner />
          <p className="mt-4 text-slate-600 font-semibold">Loading Editor...</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-5 md:gap-8 relative">
      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 rounded-xl">
          <Spinner />
          <p className="mt-4 text-slate-600 font-semibold">{loadingMessage}</p>
        </div>
      )}
      
      {/* Left Column: Canvas */}
      <div className="md:col-span-3 space-y-4">
        <h2 className="text-2xl font-bold text-slate-800 md:hidden">Edit Pattern</h2>
        <div className="relative w-full rounded-xl overflow-hidden shadow-lg bg-gray-200">
          <canvas ref={patternCanvasRef} />
        </div>
      </div>
      
      {/* Right Column: Controls */}
      <div className="md:col-span-2 flex flex-col space-y-4 mt-6 md:mt-0">
         <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
            <ControlSlider label="Stitch Count (width)" value={currentState.gridSize} min={16} max={100} onChange={e => setState({ gridSize: Number(e.target.value) })} />
            <ControlSlider label="Silhouette Threshold" value={currentState.threshold} min={0} max={255} onChange={e => setState({ threshold: Number(e.target.value) })} />
            <ControlSlider label="Outline Offset" unit="px" value={currentState.outlineOffset} min={0} max={10} onChange={e => setState({ outlineOffset: Number(e.target.value) })} />
            
            <ControlGroup label="Fill Shape">
              <div className="grid grid-cols-2 gap-2">
                <ShapeButton shape="circle" activeShape={currentState.fillShape} onClick={() => setState({ fillShape: 'circle' })} />
                <ShapeButton shape="square" activeShape={currentState.fillShape} onClick={() => setState({ fillShape: 'square' })} />
              </div>
            </ControlGroup>

            <ControlGroup label="Thread Color">
              <div className="grid grid-cols-6 gap-2">
                {DMC_COLORS.map((color) => (
                  <button key={color.dmc} onClick={() => setState({ selectedColor: color })}
                    className={`w-full h-10 rounded-lg border-2 transition-all ${currentState.selectedColor.dmc === color.dmc ? 'border-sky-500 ring-2 ring-sky-500 ring-offset-1' : 'border-slate-300 hover:border-sky-400'}`}
                    style={{ backgroundColor: color.hex }}
                    aria-label={`Select color ${color.name} ${color.dmc}`} />
                ))}
              </div>
            </ControlGroup>
        </div>
        
        <div className="flex flex-col space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <button onClick={handleUndo} disabled={!canUndo} className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed">
                    <UndoIcon className="w-5 h-5" />
                    Undo
                </button>
                <button onClick={handleRedo} disabled={!canRedo} className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed">
                    <RedoIcon className="w-5 h-5" />
                    Redo
                </button>
            </div>
            <button onClick={handleSavePattern} disabled={saveStatus !== 'idle'}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-emerald-500 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-600 transition-all disabled:bg-emerald-300">
                <SaveIcon className="w-5 h-5" />
                {saveStatus === 'saved' ? 'Pattern Saved!' : 'Save Pattern'}
            </button>
            <button onClick={handleDownloadPdfWithInstructions} disabled={loading}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-sky-500 text-white font-semibold rounded-lg shadow-md hover:bg-sky-600 transition-all disabled:bg-sky-300">
                <DownloadIcon className="w-5 h-5" />
                PDF (with Instructions)
            </button>
            <button onClick={handleDownloadPdfWithoutInstructions} disabled={loading}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-slate-700 text-white font-semibold rounded-lg shadow-md hover:bg-slate-800 transition-all disabled:bg-slate-400">
                <DownloadIcon className="w-5 h-5" />
                PDF (Pattern Only)
            </button>
            <button onClick={handleDownloadSvg} disabled={loading}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-indigo-500 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-600 transition-all disabled:bg-indigo-300">
                <SvgFileIcon className="w-5 h-5" />
                Download SVG
            </button>
        </div>
      </div>
    </div>
  );
};

// --- Control Sub-components ---
const ControlGroup: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
    {children}
  </div>
);

const ControlSlider: React.FC<{label: string, value: number, unit?: string, min: number, max: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}> = ({label, value, unit, min, max, onChange}) => (
  <div>
    <label htmlFor={label} className="block text-sm font-medium text-slate-700">{label}: {value}{unit}</label>
    <input id={label} type="range" min={min} max={max} value={value} onChange={onChange} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500" />
  </div>
);

const ShapeButton: React.FC<{shape: 'circle' | 'square', activeShape: string, onClick: () => void}> = ({shape, activeShape, onClick}) => (
  <button onClick={onClick}
    className={`flex items-center justify-center gap-2 p-3 rounded-lg border font-semibold transition-colors ${
      activeShape === shape ? 'bg-sky-500 border-sky-500 text-white' : 'bg-white border-slate-300 text-slate-700 hover:border-sky-500'
    }`}
  >
    {shape === 'circle' ? <CircleIcon className="w-5 h-5" /> : <SquareIcon className="w-5 h-5" />}
    <span className="capitalize">{shape}</span>
  </button>
);

// --- Helper Functions for Contour Tracing (unchanged) ---
// ... (Keep existing helper functions: getBackgroundGrid, traceAndSimplifyContours, simplifyPath)
function getBackgroundGrid(stitchGrid: boolean[][], width: number, height: number): boolean[][] {
  const backgroundGrid = Array.from({ length: height }, () => Array(width).fill(false));
  const queue: [number, number][] = [];

  for (let y = 0; y < height; y++) {
    if (!stitchGrid[y][0]) { backgroundGrid[y][0] = true; queue.push([y, 0]); }
    if (width > 1 && !stitchGrid[y][width - 1]) { backgroundGrid[y][width - 1] = true; queue.push([y, width - 1]); }
  }
  for (let x = 0; x < width; x++) {
    if (!stitchGrid[0][x]) { backgroundGrid[0][x] = true; queue.push([0, x]); }
    if (height > 1 && !stitchGrid[height - 1][x]) { backgroundGrid[height - 1][x] = true; queue.push([height - 1, x]); }
  }

  while (queue.length > 0) {
    const [y, x] = queue.shift()!;
    const neighbors = [[y - 1, x], [y + 1, x], [y, x - 1], [y, x + 1]];
    for (const [ny, nx] of neighbors) {
      if (ny >= 0 && ny < height && nx >= 0 && nx < width && !backgroundGrid[ny][nx] && !stitchGrid[ny][nx]) {
        backgroundGrid[ny][nx] = true;
        queue.push([ny, nx]);
      }
    }
  }
  return backgroundGrid;
}

function traceAndSimplifyContours(stitchGrid: boolean[][], backgroundGrid: boolean[][], width: number, height: number): [number, number][][] {
    const horizontalEdges = new Set<string>();
    const verticalEdges = new Set<string>();

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (stitchGrid[y][x]) {
                if (y === 0 || backgroundGrid[y - 1][x]) horizontalEdges.add(`${x},${y}`);
                if (y === height - 1 || backgroundGrid[y + 1][x]) horizontalEdges.add(`${x},${y + 1}`);
                if (x === 0 || backgroundGrid[y][x - 1]) verticalEdges.add(`${x},${y}`);
                if (x === width - 1 || backgroundGrid[y][x + 1]) verticalEdges.add(`${x + 1},${y}`);
            }
        }
    }

    const pointsToEdges = new Map<string, { p1: [number, number]; p2: [number, number] }[]>();
    const addEdgeToMap = (p1: [number, number], p2: [number, number]) => {
        const edge = { p1, p2 };
        const key1 = p1.join(',');
        const key2 = p2.join(',');
        if (!pointsToEdges.has(key1)) pointsToEdges.set(key1, []);
        if (!pointsToEdges.has(key2)) pointsToEdges.set(key2, []);
        pointsToEdges.get(key1)!.push(edge);
        pointsToEdges.get(key2)!.push(edge);
    };

    horizontalEdges.forEach(key => {
        const [x, y] = key.split(',').map(Number);
        addEdgeToMap([x, y], [x + 1, y]);
    });
    verticalEdges.forEach(key => {
        const [x, y] = key.split(',').map(Number);
        addEdgeToMap([x, y], [x, y + 1]);
    });
    
    const visitedPoints = new Set<string>();
    const allPaths: [number, number][][] = [];

    for (const startPointKey of pointsToEdges.keys()) {
        if (visitedPoints.has(startPointKey)) continue;

        let currentPointKey = startPointKey;
        const startPoint = startPointKey.split(',').map(Number) as [number, number];
        let currentPoint = startPoint;
        const path: [number, number][] = [currentPoint];
        visitedPoints.add(currentPointKey);

        while (true) {
            const connectedEdges = pointsToEdges.get(currentPointKey) || [];
            let nextPoint: [number, number] | null = null;

            for (const edge of connectedEdges) {
                const p1Key = edge.p1.join(',');
                const p2Key = edge.p2.join(',');
                let candidateKey: string | null = null;
                if (p1Key === currentPointKey) candidateKey = p2Key;
                if (p2Key === currentPointKey) candidateKey = p1Key;

                if (candidateKey && !visitedPoints.has(candidateKey)) {
                    nextPoint = candidateKey.split(',').map(Number) as [number, number];
                    break;
                }
            }

            if (nextPoint) {
                const nextPointKey = nextPoint.join(',');
                path.push(nextPoint);
                visitedPoints.add(nextPointKey);
                currentPointKey = nextPointKey;
            } else {
                break; 
            }
        }
        if(path.length > 1) {
            allPaths.push(simplifyPath(path));
        }
    }

    return allPaths;
}

function simplifyPath(path: [number, number][]): [number, number][] {
    if (path.length < 3) return path;
    const simplified = [path[0]];
    for (let i = 1; i < path.length - 1; i++) {
        const p_prev = simplified[simplified.length - 1];
        const p_curr = path[i];
        const p_next = path[i + 1];
        const cross_product = (p_curr[1] - p_prev[1]) * (p_next[0] - p_curr[0]) - (p_curr[0] - p_prev[0]) * (p_next[1] - p_curr[1]);
        if (Math.abs(cross_product) > 1e-9) { 
            simplified.push(p_curr);
        }
    }
    simplified.push(path[path.length - 1]);

    if (simplified.length >= 3) {
        const p_prev = simplified[simplified.length - 2];
        const p_curr = simplified[simplified.length - 1];
        const p_next = simplified[0];
         const cross_product = (p_curr[1] - p_prev[1]) * (p_next[0] - p_curr[0]) - (p_curr[0] - p_prev[0]) * (p_next[1] - p_curr[1]);
        if (Math.abs(cross_product) < 1e-9) {
          simplified.pop();
      }
    }
     if (simplified.length >= 3) {
        const p_prev = simplified[simplified.length - 1];
        const p_curr = simplified[0];
        const p_next = simplified[1];
        const cross_product = (p_curr[1] - p_prev[1]) * (p_next[0] - p_curr[0]) - (p_curr[0] - p_prev[0]) * (p_next[1] - p_curr[1]);
        if (Math.abs(cross_product) < 1e-9) {
            simplified.shift();
        }
    }
    return simplified;
}

export default EditorScreen;