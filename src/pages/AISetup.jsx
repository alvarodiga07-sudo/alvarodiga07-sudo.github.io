import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Download, Key, Sparkles, Terminal, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { detectAI, setApiKey, getApiKey, checkOllama } from '@/lib/claudeAI';
import { toast } from 'sonner';

const OPTION_OLLAMA = 'ollama';
const OPTION_CLAUDE = 'claude';

export default function AISetup() {
  const navigate = useNavigate();
  const [option, setOption] = useState(OPTION_OLLAMA);
  const [ai, setAI] = useState(null);
  const [checking, setChecking] = useState(true);
  const [apiKeyInput, setApiKeyInput] = useState(getApiKey());

  useEffect(() => {
    detectAI().then(a => { setAI(a); setChecking(false); });
  }, []);

  const recheck = async () => {
    setChecking(true);
    const a = await detectAI();
    setAI(a);
    setChecking(false);
    if (a.provider === 'ollama') toast.success('¡Ollama detectado!');
  };

  const handleSaveKey = () => {
    setApiKey(apiKeyInput.trim());
    toast.success('Clave guardada');
    navigate(-1);
  };

  const ollamaReady = ai?.provider === 'ollama';
  const ollamaRunning = ai?.provider === 'ollama' || ai?.provider === 'ollama_no_model';

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">Configurar IA</h1>
      </div>

      {/* Status */}
      {!checking && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mx-5 mb-5 rounded-2xl p-4 border flex items-center gap-3 ${
            ollamaReady || ai?.provider === 'claude'
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
              : 'bg-secondary border-border'
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${ollamaReady || ai?.provider === 'claude' ? 'bg-green-500' : 'bg-muted'}`}>
            {ollamaReady || ai?.provider === 'claude'
              ? <Check className="w-4 h-4 text-white" />
              : <Sparkles className="w-4 h-4 text-muted-foreground" />
            }
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              {ollamaReady ? `Ollama activo — ${ai.model}` :
               ai?.provider === 'claude' ? 'Claude API configurada' :
               'IA no configurada'}
            </p>
            <p className="text-xs text-muted-foreground">
              {ollamaReady ? 'La IA generará itinerarios automáticamente' :
               ai?.provider === 'claude' ? 'Los viajes usarán Claude para los itinerarios' :
               'Elige una opción para activar la IA'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={recheck} className="rounded-full h-8 w-8 flex-shrink-0">
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
          </Button>
        </motion.div>
      )}

      {/* Option tabs */}
      <div className="px-5 flex gap-3 mb-5">
        {[
          { id: OPTION_OLLAMA, label: 'Ollama (gratis)', icon: '🖥️' },
          { id: OPTION_CLAUDE, label: 'Claude API', icon: '🤖' },
        ].map(o => (
          <button
            key={o.id}
            onClick={() => setOption(o.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border-2 text-xs font-semibold transition-all ${
              option === o.id ? 'border-primary bg-primary/5' : 'border-border bg-card'
            }`}
          >
            <span className="text-xl">{o.icon}</span>
            {o.label}
          </button>
        ))}
      </div>

      {option === OPTION_OLLAMA && (
        <div className="px-5 space-y-4">
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="text-sm font-bold text-foreground mb-1">¿Qué es Ollama?</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ollama es una app gratuita que ejecuta IA directamente en tu Mac, sin internet ni cuentas. Funciona con modelos como Mistral o LLaMA 3.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                num: 1,
                title: 'Descargar Ollama',
                desc: 'Descarga la app oficial para macOS (169 MB)',
                action: (
                  <a
                    href="https://ollama.com/download/mac"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-xl"
                  >
                    <Download className="w-3.5 h-3.5" /> Descargar de ollama.com
                  </a>
                ),
              },
              {
                num: 2,
                title: 'Abrir la app',
                desc: 'Abre Ollama desde Applications. Verás el icono de llama en la barra de menú.',
              },
              {
                num: 3,
                title: 'Descargar el modelo',
                desc: 'Abre el Terminal y ejecuta este comando:',
                code: 'ollama pull mistral',
                note: '~4 GB. Solo se hace una vez.',
              },
              {
                num: 4,
                title: 'Verificar',
                desc: 'Pulsa el botón de abajo para comprobar que Ollama está listo.',
                action: (
                  <Button onClick={recheck} size="sm" variant="outline" className="rounded-xl text-xs">
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Comprobar conexión
                  </Button>
                ),
              },
            ].map((step) => (
              <div key={step.num} className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">{step.num}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{step.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                    {step.code && (
                      <div className="bg-secondary rounded-lg px-3 py-2 mt-2 flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <code className="text-xs font-mono text-foreground">{step.code}</code>
                      </div>
                    )}
                    {step.note && <p className="text-[11px] text-muted-foreground mt-1.5 italic">{step.note}</p>}
                    {step.action && <div className="mt-2">{step.action}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {ollamaReady && (
            <Button onClick={() => navigate('/trips')} className="w-full h-12 rounded-xl">
              <Check className="w-4 h-4 mr-2" />
              ¡Todo listo! Crear mi primer viaje con IA
            </Button>
          )}
        </div>
      )}

      {option === OPTION_CLAUDE && (
        <div className="px-5 space-y-4">
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="text-sm font-bold text-foreground mb-1">API Key de Anthropic</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Claude es el modelo de IA más capaz. El plan gratuito incluye suficientes créditos para generar muchos itinerarios.
            </p>
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
            >
              Crear cuenta gratis en console.anthropic.com
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {[
            { num: 1, title: 'Crear cuenta', desc: 'Ve a console.anthropic.com y regístrate gratis.' },
            { num: 2, title: 'Generar clave', desc: 'En Settings → API Keys → Create Key. Cópiala.' },
            { num: 3, title: 'Pega tu clave aquí:', desc: '' },
          ].map((step) => (
            <div key={step.num} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">{step.num}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  {step.desc && <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>}
                  {step.num === 3 && (
                    <div className="mt-2 flex gap-2">
                      <Input
                        type="password"
                        placeholder="sk-ant-api03-..."
                        value={apiKeyInput}
                        onChange={e => setApiKeyInput(e.target.value)}
                        className="h-10 rounded-xl font-mono text-xs"
                      />
                      <Button onClick={handleSaveKey} disabled={!apiKeyInput.trim()} className="h-10 rounded-xl px-4 flex-shrink-0">
                        <Key className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
