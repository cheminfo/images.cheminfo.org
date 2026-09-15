import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import 'react-cheminfo/styles/chrome.css';
import './styles/tokens.css';
import './styles/global.css';

import { FocusStyleManager } from '@blueprintjs/core';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App.tsx';

FocusStyleManager.onlyShowFocusOnTabs();

const container = document.querySelector('#root');
if (container === null) {
  throw new Error('index.html has no <div id="root"></div> to mount into.');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
