import { render } from 'preact';
import './style';
import App from './components/app';

// Export default para preact-cli
export default App;

// Render la aplicación si estamos en el browser
if (typeof window !== 'undefined') {
  render(<App />, document.body);
}
