/**
 * Script para atualizar automaticamente o arquivo version.json antes do build
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtém o diretório atual do script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

// Cria o diretório dist se não existir
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Lê a versão atual do package.json
const packageJson = JSON.parse(fs.readFileSync(path.resolve(rootDir, 'package.json'), 'utf8'));
const currentVersion = packageJson.version || '1.0.0';

// Cria o conteúdo do arquivo version.json
const versionData = {
  version: currentVersion,
  buildDate: new Date().toISOString()
};

// Escreve o arquivo version.json na pasta dist
fs.writeFileSync(
  path.resolve(distDir, 'version.json'),
  JSON.stringify(versionData, null, 2)
);

console.log(`✅ Arquivo version.json atualizado para a versão ${currentVersion}`); 