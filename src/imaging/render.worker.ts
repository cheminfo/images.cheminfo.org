import { serveWorkerRequests } from 'react-cheminfo/core';

import type { RenderRequest, RenderResult } from './render.ts';
import { renderImage } from './render.ts';

serveWorkerRequests<RenderRequest, RenderResult>(renderImage);
