// Polyfills para Jest
import { TextEncoder, TextDecoder } from 'util';

// Configurar TextEncoder y TextDecoder globalmente
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Configurar fetch mock si es necesario
global.fetch = jest.fn();

// Configurar otras APIs del navegador que podrían faltar
global.HTMLCanvasElement.prototype.getContext = jest.fn();
global.HTMLCanvasElement.prototype.toDataURL = jest.fn();

// Configurar ResizeObserver mock
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Configurar IntersectionObserver mock
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
