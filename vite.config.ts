import type { Plugin, ViteDevServer } from 'vite';
import { defineConfig } from 'vitest/config';
import { compileInk, formatInkResult, inkErrorText, STORY_DIR } from './scripts/ink.mjs';

/**
 * Compiles ink on dev start and build, and recompiles on every .ink change in dev.
 * Errors print in the terminal; in dev they also show in Vite's browser overlay and the
 * last good JSON is kept. At build time an ink error fails the build.
 */
function ink(): Plugin {
  let isDev = false;

  const compileAndReport = (server?: ViteDevServer) => {
    const result = compileInk();
    console.log(formatInkResult(result));
    if (!result.ok && server) {
      server.ws.send({ type: 'error', err: { message: `ink compilation failed\n\n${inkErrorText(result)}`, stack: '' } });
    }
    return result;
  };

  return {
    name: 'clipped-wing:ink',
    configResolved(config) {
      isDev = config.command === 'serve';
    },
    buildStart() {
      const result = compileAndReport();
      if (!result.ok && !isDev) this.error('ink compilation failed (see errors above)');
    },
    configureServer(server) {
      server.watcher.add(STORY_DIR);
      const onInkChange = (file: string) => {
        if (file.endsWith('.ink')) compileAndReport(server);
      };
      server.watcher.on('change', onInkChange);
      server.watcher.on('add', onInkChange);
      server.watcher.on('unlink', onInkChange);
    },
  };
}

export default defineConfig({
  // Relative asset paths so the build works from any folder (e.g. itch.io's iframe).
  base: './',
  plugins: [ink()],
  build: {
    // Phaser alone is ~1.2 MB minified; don't warn about it.
    chunkSizeWarningLimit: 2000,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    // (The first test in a file compiles the whole story, which takes a few seconds now.)
    testTimeout: 20000,
  },
});
