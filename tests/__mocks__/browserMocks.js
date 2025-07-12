// Mock Browser API's which are not supported by JSDOM, e.g. ServiceWorker, LocalStorage
/**
 * An example how to mock localStorage is given below 👇
 */

// Polyfills para APIs que faltan en JSDOM
const { TextEncoder, TextDecoder } = require('util');

// Configurar TextEncoder y TextDecoder globalmente
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock para fetch si no está disponible
if (!global.fetch) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      ok: true,
      status: 200,
    })
  );
}

// Mock para Canvas
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = jest.fn();
  HTMLCanvasElement.prototype.toDataURL = jest.fn();
}

// Mock para ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock para IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock para URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

/*
// Mocks localStorage
const localStorageMock = (function() {
	let store = {};

	return {
		getItem: (key) => store[key] || null,
		setItem: (key, value) => store[key] = value.toString(),
		clear: () => store = {}
	};

})();

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock
}); */
