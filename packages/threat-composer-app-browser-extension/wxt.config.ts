import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';
import copy from 'rollup-plugin-copy';

const tcAppExtensionListerScript = 'browserExtensionInterface.js'

export default defineConfig({
  vite: () => ({
    build: {
      emptyOutDir: false
    },
    plugins: [
      react(),
      copy({
        targets: [{
          src: '../threat-composer-app/build_extension/index.html',
          dest: './.output/chrome-mv3',
          transform: (contents, filename) => contents.toString().replace('<\/body><\/html>', '<script src=\"' + tcAppExtensionListerScript + '\"><\/script><\/body><\/html>')
        }],
        copyOnce: true
      }),
      copy({
        targets: [{
          src: ['../threat-composer-app/build_extension/**/*', '!../threat-composer-app/build_extension/index.html'],
          dest: './.output/chrome-mv3',
        }],
        copyOnce: true
      })
    ]
  }),
  srcDir: 'src',
  manifest: {
    name: 'Threat Composer Viewer',
    description: "View a Threat Composer JSON export in Threat Composer",
    content_scripts: [
      {
        matches: ["*://*/*.tc.json*", "*://*.github.com/*"],
        js: ['content-script.js'],
        run_at: "document_end"
      }
    ],
    web_accessible_resources: [
      {
        "resources": ["code_catalyst_inject_script.js"],
        "matches": ["https://codecatalyst.aws/*"]
      }
    ],
    permissions: ["storage", "tabs"],
  },
  imports: true
});