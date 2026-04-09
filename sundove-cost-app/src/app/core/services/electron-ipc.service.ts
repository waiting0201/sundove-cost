import { Injectable } from '@angular/core';
import { IpcChannel } from '../models/ipc-channels.model';
import { MOCK_DATA } from './mock-data';

declare global {
  interface Window {
    electronAPI?: {
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
      on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
    };
  }
}

@Injectable({ providedIn: 'root' })
export class ElectronIpcService {
  readonly isElectron = !!window.electronAPI;

  invoke<TRes = unknown>(channel: IpcChannel, payload?: unknown): Promise<TRes> {
    if (window.electronAPI) {
      return window.electronAPI.invoke(channel, payload) as Promise<TRes>;
    }
    // Browser fallback: return mock data for development
    return this.mockInvoke(channel, payload) as Promise<TRes>;
  }

  on<T = unknown>(channel: string, callback: (data: T) => void): () => void {
    if (window.electronAPI) {
      return window.electronAPI.on(channel, callback as (...args: unknown[]) => void);
    }
    return () => {};
  }

  private mockInvoke(channel: string, payload?: unknown): Promise<unknown> {
    const data = MOCK_DATA[channel];
    if (typeof data === 'function') {
      return Promise.resolve(data(payload));
    }
    return Promise.resolve(data ?? []);
  }
}
