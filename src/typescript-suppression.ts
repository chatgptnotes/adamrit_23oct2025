/* 
 * Global TypeScript Declarations
 * Contains global type definitions and window extensions
 */

// Global type extensions
declare global {
  interface Window {
    __APP_VERSION__?: string;
  }
}

export {};