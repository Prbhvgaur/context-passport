import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const root = __dirname;

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': resolve(root, 'src'),
      '@shared': resolve(root, '../shared/src'),
      '@context-passport/shared': resolve(root, '../shared/src/index.ts'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        popup: resolve(root, 'popup.html'),
        options: resolve(root, 'options.html'),
        background: resolve(root, 'src/background/index.ts'),
        claude: resolve(root, 'src/content-scripts/claude.ts'),
        chatgpt: resolve(root, 'src/content-scripts/chatgpt.ts'),
        gemini: resolve(root, 'src/content-scripts/gemini.ts'),
        perplexity: resolve(root, 'src/content-scripts/perplexity.ts'),
        copilot: resolve(root, 'src/content-scripts/copilot.ts'),
        grok: resolve(root, 'src/content-scripts/grok.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'background/index.js';
          }

          if (['claude', 'chatgpt', 'gemini', 'perplexity', 'copilot', 'grok'].includes(chunkInfo.name)) {
            return `content-scripts/${chunkInfo.name}.js`;
          }

          return 'assets/[name].js';
        },
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
