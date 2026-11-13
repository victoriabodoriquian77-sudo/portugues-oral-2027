#!/bin/bash
# Doble clic para abrir la app (servidor local + navegador).
cd "$(dirname "$0")" || exit 1
export PATH="$HOME/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

if ! command -v node >/dev/null 2>&1; then
  echo "No encuentro Node.js. Hablale a Nico para instalarlo."
  read -n 1 -s -r -p "Tocá una tecla para cerrar…"
  exit 1
fi

clear
node servidor.mjs
echo ""
echo "El servidor se cerró. Podés cerrar esta ventana."
