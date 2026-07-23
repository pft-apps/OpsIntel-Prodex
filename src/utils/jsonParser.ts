// @ts-ignore
import ParserWorker from './jsonWorker?worker';

let worker: any = null;
const pendingPromises = new Map<string, { resolve: (val: any) => void; reject: (err: any) => void }>();

function getWorker() {
  if (!worker) {
    try {
      worker = new ParserWorker();
      worker.onmessage = (event: MessageEvent) => {
        const { id, status, data, error } = event.data;
        const promise = pendingPromises.get(id);
        if (promise) {
          pendingPromises.delete(id);
          if (status === 'success') {
            promise.resolve(data);
          } else {
            promise.reject(new Error(error));
          }
        }
      };
    } catch (e) {
      console.warn('Failed to initialize Web Worker, falling back to main-thread parsing:', e);
      worker = null;
    }
  }
  return worker;
}

/**
 * Parses JSON asynchronously using a background Web Worker to prevent UI blocking.
 * If Web Workers are unsupported or fail to initialize, falls back to synchronous JSON.parse.
 */
export function parseJsonAsync(text: string): Promise<any> {
  if (typeof Worker === 'undefined') {
    try {
      return Promise.resolve(JSON.parse(text));
    } catch (err) {
      return Promise.reject(err);
    }
  }

  const activeWorker = getWorker();
  if (!activeWorker) {
    try {
      return Promise.resolve(JSON.parse(text));
    } catch (err) {
      return Promise.reject(err);
    }
  }

  return new Promise((resolve, reject) => {
    const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    pendingPromises.set(id, { resolve, reject });
    try {
      activeWorker.postMessage({ id, text });
    } catch (err) {
      pendingPromises.delete(id);
      try {
        resolve(JSON.parse(text));
      } catch (parseErr) {
        reject(parseErr);
      }
    }
  });
}
