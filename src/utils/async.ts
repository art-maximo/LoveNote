import { TIMEOUT_MESSAGE } from '../lib/errors';

// Rejeita com erro de timeout se a promessa demorar mais que `ms`.
export function withTimeout<T>(promise: PromiseLike<T>, ms = 15000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(TIMEOUT_MESSAGE)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}