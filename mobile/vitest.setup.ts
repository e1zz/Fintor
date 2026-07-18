import Module from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { vi } from 'vitest';

const root = path.dirname(fileURLToPath(import.meta.url));
const rnStub = path.join(root, 'test', 'react-native-stub.js');

// RNTL require('react-native') bypasses Vite aliases — point Node at our stub.
const originalResolve = (Module as any)._resolveFilename;
(Module as any)._resolveFilename = function (
  request: string,
  parent: unknown,
  isMain: boolean,
  options: unknown,
) {
  if (request === 'react-native') return rnStub;
  return originalResolve.call(this, request, parent, isMain, options);
};

// Image/font requires in screens (e.g. require('../../assets/x.png'))
const stubAsset = (mod: NodeModule) => {
  (mod as any).exports = 'test-file-stub';
};
for (const ext of ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ttf', '.otf']) {
  (Module as any)._extensions[ext] = stubAsset;
}

vi.mock('react-native', () => require('./test/react-native-stub.js'));

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

vi.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      version: '1.0.0',
      extra: { apiBaseUrl: 'http://localhost:8000/api/v1/' },
    },
    nativeAppVersion: '1.0.0',
  },
}));
