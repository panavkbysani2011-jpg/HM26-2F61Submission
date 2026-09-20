import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const dirPath = path.resolve(import.meta.dirname, '.');
  const env = { ...loadEnv(mode, process.cwd(), ''), ...loadEnv(mode, dirPath, '') };
  const geminiApiKey =
    env.VITE_GEMINI_API_KEY ||
    env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    '';

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'save-gemini-key-plugin',
        configureServer(server) {
          server.middlewares.use('/api/save-gemini-key', (req, res) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', () => {
                try {
                  const { key } = JSON.parse(body);
                  if (key && typeof key === 'string') {
                    const trimmed = key.trim();
                    const envPath = path.resolve(dirPath, '.env');
                    let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
                    if (content.includes('GEMINI_API_KEY=')) {
                      content = content.replace(/GEMINI_API_KEY=.*(\r?\n|$)/, `GEMINI_API_KEY="${trimmed}"$1`);
                    } else {
                      content += `\nGEMINI_API_KEY="${trimmed}"\n`;
                    }
                    if (content.includes('VITE_GEMINI_API_KEY=')) {
                      content = content.replace(/VITE_GEMINI_API_KEY=.*(\r?\n|$)/, `VITE_GEMINI_API_KEY="${trimmed}"$1`);
                    } else {
                      content += `\nVITE_GEMINI_API_KEY="${trimmed}"\n`;
                    }
                    fs.writeFileSync(envPath, content, 'utf8');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                    return;
                  }
                } catch (e) {}
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false }));
              });
            } else {
              res.writeHead(404);
              res.end();
            }
          });
        },
      },
    ],
    envPrefix: ['VITE_', 'GEMINI_'],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiApiKey),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiApiKey),
      'import.meta.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
