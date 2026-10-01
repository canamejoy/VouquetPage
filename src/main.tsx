import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { readLocalStorage } from '@/app/browserStorage';
import '@/ui/styles/tokens.css';
import '@/ui/styles/base.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root not found');
}

createRoot(container).render(
  <StrictMode>
    <App storage={readLocalStorage()} />
  </StrictMode>,
);
