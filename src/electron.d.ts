export {};

declare global {
  interface Window {
    api: {
      appName: string;
      appVersion: string;
      platform: string;
      ping: () => string;
    };
    // Exposed by electron/preload.ts via contextBridge
    electronAPI?: {
      openSecondWindow: () => void;
    };
  }
}
