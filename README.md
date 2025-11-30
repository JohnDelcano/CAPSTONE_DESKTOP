# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:


## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Capstone Desktop — project-specific instructions

This project uses Vite + React for the renderer and an Electron main process in `electron/`.

Quick commands

- Install dependencies:

```pwsh
npm install
```

- Start development (tsc watch + Vite + Electron):

```pwsh
npm run dev
```

This runs TypeScript in watch mode to compile the Electron main code, starts Vite on port 5173, and launches Electron when the dev server is ready.

- Build (renderer + electron main):

```pwsh
npm run build
```

- Package (produce distributable):

```pwsh
# one-time: install electron-builder
npm install --save-dev electron-builder

# produce unpacked app for testing
npm run package

# produce installer(s)
npm run dist
```

Notes & troubleshooting

- Vite uses port 5173. If port 5173 is in use, dev will fail (strictPort). Free the port or change it in `package.json` dev script.
- If Electron can't find `dist-electron/main.js`, run `npm run build:electron` to compile the Electron main/preload TypeScript into `dist-electron/`.
- The build uses `vite`'s `base: './'` to ensure relative asset paths when packaged.

Packaging caveats

- Packaging tools require a native build environment and will add a dev dependency (`electron-builder`). Building installers is platform-specific and may need code signing on macOS.

If you'd like, I can also:
- Add a CI workflow to build and publish installers.
- Adjust the BrowserWindow options for debugging (e.g., disable GPU caching warnings).
