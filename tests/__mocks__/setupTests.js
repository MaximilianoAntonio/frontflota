// Configuración básica para Jest
// Sin enzyme por ahora para evitar problemas de compatibilidad

// Mock adicionales si son necesarios
global.console = {
  ...console,
  // Silenciar warnings específicos si es necesario
  warn: jest.fn(),
  error: jest.fn(),
};
