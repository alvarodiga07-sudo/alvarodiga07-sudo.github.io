#!/bin/bash
export PATH="/Users/alvarodieguezgarcia/.local/bin:/Users/alvarodieguezgarcia/.local/node/bin:/usr/local/bin:$PATH"
cd "/Users/alvarodieguezgarcia/Proyectos/APP VIAJES.2/app-waddle"
exec /Users/alvarodieguezgarcia/.local/node/bin/node node_modules/.bin/vite --port 3000
