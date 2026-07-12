#!/bin/bash
export PATH="/Users/alvarodieguezgarcia/.local/bin:/Users/alvarodieguezgarcia/.local/node/bin:/usr/local/bin:$PATH"

# Start Ollama if not running
if ! curl -s http://localhost:11434/ > /dev/null 2>&1; then
  echo "Arrancando Ollama..."
  ollama serve > /tmp/ollama.log 2>&1 &
  sleep 3
fi

# Pull default model if no models exist
MODEL_COUNT=$(curl -s http://localhost:11434/api/tags 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('models',[])))" 2>/dev/null || echo "0")
if [ "$MODEL_COUNT" = "0" ]; then
  echo "Descargando modelo de IA (primera vez, ~2GB)..."
  ollama pull llama3.2
fi

# Start Vite dev server
cd "/Users/alvarodieguezgarcia/Proyectos/APP VIAJES.2/app-waddle"
exec /Users/alvarodieguezgarcia/.local/node/bin/node node_modules/.bin/vite --port 3000
