import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Layers, 
  Download, 
  Plus, 
  Loader2, 
  Trash2, 
  Maximize2, 
  Sparkles,
  Palette,
  Type,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateImage } from './services/gemini';
import { cn } from './lib/utils';
import confetti from 'canvas-confetti';

interface GeneratedItem {
  id: string;
  url: string;
  prompt: string;
  type: 'paper' | 'element';
  timestamp: number;
}

const ASPECT_RATIOS = [
  { label: '1:1', value: '1:1' as const },
  { label: '4:3', value: '4:3' as const },
  { label: '16:9', value: '16:9' as const },
  { label: '9:16', value: '9:16' as const },
];

const THEMES = [
  { name: 'Floral Delicado', prompt: 'delicate watercolor flowers, pastel colors, botanical' },
  { name: 'Geométrico Moderno', prompt: 'minimalist geometric shapes, mid-century modern, clean lines' },
  { name: 'Vintage Retrô', prompt: 'vintage paper texture, old stamps, sepia tones, victorian era' },
  { name: 'Kawaii Fofo', prompt: 'cute japanese style characters, bright colors, happy faces' },
  { name: 'Aquarela Abstrata', prompt: 'soft watercolor washes, bleeding colors, artistic' },
  { name: 'Céu Estrelado', prompt: 'night sky, galaxy, stars, deep blue and purple' },
];

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState<'paper' | 'element'>('paper');
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "3:4" | "4:3" | "9:16" | "16:9">('1:1');
  const [isSeamless, setIsSeamless] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<GeneratedItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<GeneratedItem | null>(null);
  const [activeTheme, setActiveTheme] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkApiKey();
  }, []);

  const handleOpenKeyDialog = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('papel_digital_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('papel_digital_history', JSON.stringify(history));
  }, [history]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const finalPrompt = activeTheme 
        ? `${prompt}, following the theme: ${THEMES.find(t => t.name === activeTheme)?.prompt}`
        : prompt;

      const imageUrl = await generateImage(
        isSeamless && type === 'paper' ? `seamless repeating pattern, ${finalPrompt}` : finalPrompt, 
        type, 
        aspectRatio
      );
      
      const newItem: GeneratedItem = {
        id: crypto.randomUUID(),
        url: imageUrl,
        prompt: finalPrompt,
        type,
        timestamp: Date.now(),
      };

      setHistory(prev => [newItem, ...prev]);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#5A5A40', '#f5f5f0', '#E6E6E6']
      });
    } catch (error) {
      alert("Erro ao gerar imagem. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-[#1a1a1a] font-serif">
      {!hasApiKey && (
        <div className="fixed inset-0 z-[100] bg-[#1a1a1a]/95 backdrop-blur-xl flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-8">
            <div className="w-20 h-20 bg-[#5A5A40] rounded-full flex items-center justify-center text-white mx-auto shadow-2xl">
              <Sparkles size={40} />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-white">Configuração Necessária</h2>
              <p className="text-white/60 font-sans leading-relaxed">
                Para gerar imagens de alta qualidade com o Gemini 3.1 Flash Image, você precisa selecionar uma chave de API de um projeto Google Cloud com faturamento ativado.
              </p>
            </div>
            <div className="space-y-4 pt-4">
              <button
                onClick={handleOpenKeyDialog}
                className="w-full py-4 bg-white text-[#1a1a1a] rounded-2xl font-sans font-bold hover:bg-gray-100 transition-all shadow-xl"
              >
                Selecionar Chave de API
              </button>
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-xs font-sans text-white/40 hover:text-white/60 underline underline-offset-4"
              >
                Saiba mais sobre faturamento e chaves de API
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-[#1a1a1a]/10 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#5A5A40] rounded-full flex items-center justify-center text-white">
              <Sparkles size={18} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Papel Digital AI</h1>
          </div>
          <div className="flex items-center gap-4 text-sm font-sans text-[#1a1a1a]/60">
            <span className="hidden sm:inline">Crie padrões e elementos únicos</span>
            <div className="h-4 w-[1px] bg-[#1a1a1a]/10 hidden sm:block" />
            <button className="hover:text-[#1a1a1a] transition-colors">
              <Info size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Controls */}
        <aside className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-[#1a1a1a]/5 space-y-6">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-sans font-semibold text-[#1a1a1a]/50">
                O que você quer criar?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setType('paper')}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 rounded-xl border transition-all font-sans text-sm",
                    type === 'paper' 
                      ? "bg-[#5A5A40] text-white border-[#5A5A40] shadow-md" 
                      : "bg-white text-[#1a1a1a] border-[#1a1a1a]/10 hover:border-[#5A5A40]/50"
                  )}
                >
                  <Layers size={18} />
                  Papel Digital
                </button>
                <button
                  onClick={() => setType('element')}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 rounded-xl border transition-all font-sans text-sm",
                    type === 'element' 
                      ? "bg-[#5A5A40] text-white border-[#5A5A40] shadow-md" 
                      : "bg-white text-[#1a1a1a] border-[#1a1a1a]/10 hover:border-[#5A5A40]/50"
                  )}
                >
                  <ImageIcon size={18} />
                  Elemento
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-sans font-semibold text-[#1a1a1a]/50">
                Descreva sua ideia
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Flores de cerejeira em aquarela com fundo creme..."
                className="w-full h-32 p-4 rounded-2xl border border-[#1a1a1a]/10 focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] outline-none transition-all resize-none font-sans text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-sans font-semibold text-[#1a1a1a]/50">
                Formato (Aspect Ratio)
              </label>
              <div className="flex flex-wrap gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.value}
                    onClick={() => setAspectRatio(ratio.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border text-xs font-sans transition-all",
                      aspectRatio === ratio.value
                        ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                        : "bg-white text-[#1a1a1a] border-[#1a1a1a]/10 hover:border-[#1a1a1a]/30"
                    )}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>

            {type === 'paper' && (
              <div className="flex items-center justify-between p-4 rounded-2xl border border-[#1a1a1a]/10 bg-[#f5f5f0]/30">
                <div className="space-y-0.5">
                  <p className="text-sm font-sans font-semibold">Padrão Repetível</p>
                  <p className="text-xs font-sans text-[#1a1a1a]/40">Cria um padrão sem emendas</p>
                </div>
                <button
                  onClick={() => setIsSeamless(!isSeamless)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    isSeamless ? "bg-[#5A5A40]" : "bg-gray-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    isSeamless ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className={cn(
                "w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-sans font-bold text-white transition-all shadow-lg",
                isGenerating || !prompt.trim()
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[#5A5A40] hover:bg-[#4a4a35] active:scale-[0.98]"
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Criando Magia...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Gerar Agora
                </>
              )}
            </button>
          </section>

          <section className="bg-white rounded-3xl p-6 shadow-sm border border-[#1a1a1a]/5 space-y-4">
            <div className="flex items-center gap-2 text-[#1a1a1a]/50">
              <Palette size={16} />
              <h2 className="text-xs uppercase tracking-widest font-sans font-semibold">Temas Sugeridos</h2>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {THEMES.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => {
                    setActiveTheme(activeTheme === theme.name ? null : theme.name);
                    if (activeTheme !== theme.name) {
                      setPrompt(theme.name);
                    }
                  }}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border text-sm font-sans transition-all group",
                    activeTheme === theme.name
                      ? "bg-[#f5f5f0] border-[#5A5A40] text-[#5A5A40]"
                      : "bg-white border-[#1a1a1a]/5 hover:border-[#1a1a1a]/20"
                  )}
                >
                  {theme.name}
                  <ChevronRight size={14} className={cn("transition-transform", activeTheme === theme.name && "rotate-90")} />
                </button>
              ))}
            </div>
          </section>
        </aside>

        {/* Main Content / Gallery */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Suas Criações</h2>
            <div className="text-sm font-sans text-[#1a1a1a]/40">
              {history.length} itens gerados
            </div>
          </div>

          {history.length === 0 ? (
            <div className="bg-white/50 border-2 border-dashed border-[#1a1a1a]/10 rounded-[2rem] h-[500px] flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-16 h-16 bg-[#1a1a1a]/5 rounded-full flex items-center justify-center text-[#1a1a1a]/20">
                <Plus size={32} />
              </div>
              <div className="space-y-1">
                <p className="font-sans font-medium text-[#1a1a1a]/60">Nenhuma criação ainda</p>
                <p className="font-sans text-sm text-[#1a1a1a]/40 max-w-xs">
                  Use o painel ao lado para começar a criar seus papéis digitais e elementos exclusivos.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {history.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group relative bg-white rounded-3xl overflow-hidden shadow-sm border border-[#1a1a1a]/5 hover:shadow-xl transition-all cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="aspect-square relative overflow-hidden bg-[#f0f0f0]">
                      <img 
                        src={item.url} 
                        alt={item.prompt}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                          }}
                          className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#1a1a1a] hover:scale-110 transition-transform"
                        >
                          <Maximize2 size={18} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(item.url, `papel-digital-${item.id}`);
                          }}
                          className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#1a1a1a] hover:scale-110 transition-transform"
                        >
                          <Download size={18} />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(item.id, e)}
                          className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-500 hover:scale-110 transition-transform"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="p-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest font-sans font-bold text-[#1a1a1a]/40">
                          {item.type === 'paper' ? 'Papel Digital' : 'Elemento'}
                        </span>
                        <span className="text-[10px] font-sans text-[#1a1a1a]/30">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm font-sans truncate text-[#1a1a1a]/70">{item.prompt}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Modal Preview */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-[#1a1a1a]/90 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] overflow-hidden max-w-4xl w-full max-h-full flex flex-col sm:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-1 bg-[#f0f0f0] relative min-h-[300px]">
                <img 
                  src={selectedItem.url} 
                  alt={selectedItem.prompt}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="w-full sm:w-80 p-8 flex flex-col justify-between bg-white">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs uppercase tracking-widest font-sans font-bold text-[#5A5A40]">
                      {selectedItem.type === 'paper' ? 'Papel Digital' : 'Elemento Decorativo'}
                    </span>
                    <h3 className="text-2xl font-bold leading-tight">Detalhes da Criação</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs font-sans font-semibold text-[#1a1a1a]/40 uppercase tracking-wider">Prompt Utilizado</p>
                      <p className="text-sm font-sans text-[#1a1a1a]/80 italic leading-relaxed">
                        "{selectedItem.prompt}"
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-sans font-semibold text-[#1a1a1a]/40 uppercase tracking-wider">Data de Criação</p>
                      <p className="text-sm font-sans text-[#1a1a1a]/80">
                        {new Date(selectedItem.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-8 space-y-3">
                  <button
                    onClick={() => handleDownload(selectedItem.url, `papel-digital-${selectedItem.id}`)}
                    className="w-full py-4 bg-[#5A5A40] text-white rounded-2xl font-sans font-bold flex items-center justify-center gap-2 hover:bg-[#4a4a35] transition-all shadow-lg"
                  >
                    <Download size={20} />
                    Baixar PNG
                  </button>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="w-full py-4 bg-[#1a1a1a]/5 text-[#1a1a1a] rounded-2xl font-sans font-bold hover:bg-[#1a1a1a]/10 transition-all"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-[#1a1a1a]/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#5A5A40]/20 rounded-full flex items-center justify-center text-[#5A5A40]">
              <Sparkles size={12} />
            </div>
            <span className="text-sm font-sans font-semibold text-[#1a1a1a]/60">Papel Digital AI</span>
          </div>
          <p className="text-xs font-sans text-[#1a1a1a]/40 text-center">
            &copy; 2026 Papel Digital AI. Criado com inteligência artificial para designers e artesãos.
          </p>
          <div className="flex gap-6 text-xs font-sans font-semibold text-[#1a1a1a]/40 uppercase tracking-widest">
            <a href="#" className="hover:text-[#1a1a1a] transition-colors">Termos</a>
            <a href="#" className="hover:text-[#1a1a1a] transition-colors">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
