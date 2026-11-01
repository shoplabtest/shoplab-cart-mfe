import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';
import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      // Federation rewrites `host/ui` into a runtime URL fetch, so unit tests leave it out and alias a stub instead.
      ...(mode === 'test' ? [] : [federation({
        name: 'cart',
        filename: 'remoteEntry.js',
        exposes: { './Cart': './src/Cart.tsx' },
        // The host provides auth, the API client and the cart event bus through `host/ui`.
        remotes: { host: { external: env.REMOTE_HOST_URL ?? 'http://localhost:5000/assets/remoteEntry.js', from: 'vite', externalType: 'url' } },
        shared: ['react', 'react-dom', 'react-router-dom', '@shoplab/ui-kit'],
      })]),
    ],
    // A remote has no index.html; the exposed module is the build entry.
    build: { target: 'esnext', minify: false, cssCodeSplit: false, rollupOptions: { input: 'src/Cart.tsx' } },
    preview: { cors: true },
    resolve: {
      // `host/ui` only exists at runtime; tests use a stub.
      alias: (mode === 'test' ? { 'host/ui': fileURLToPath(new URL('./test/stubs/host-ui.ts', import.meta.url)) } : {}) as Record<string, string>,
    },
    test: { environment: 'jsdom', globals: true, setupFiles: ['./test/setup.ts'] },
  };
});
