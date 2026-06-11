#!/usr/bin/env node
// Cross-platform deploy: copia i bundle dist/*.js nella cartella www di Home Assistant.
// Sostituisce `cp dist/*.js /config/www/` (POSIX-only) così funziona anche su Windows.
// Target sovrascrivibile con la variabile d'ambiente HA_WWW (default: /config/www).
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const target = process.env.HA_WWW || '/config/www';

if (!fs.existsSync(distDir)) {
  console.error(`[deploy] cartella dist mancante: ${distDir} — esegui prima 'npm run build'`);
  process.exit(1);
}
if (!fs.existsSync(target)) {
  console.error(`[deploy] cartella target inesistente: ${target} (imposta HA_WWW per cambiarla)`);
  process.exit(1);
}

const files = fs.readdirSync(distDir).filter(f => f.endsWith('.js'));
if (files.length === 0) {
  console.error(`[deploy] nessun .js in ${distDir}`);
  process.exit(1);
}

for (const f of files) {
  fs.copyFileSync(path.join(distDir, f), path.join(target, f));
  console.log(`[deploy] ${f} -> ${path.join(target, f)}`);
}
console.log(`[deploy] ${files.length} file copiati in ${target}`);
