import {createRoot} from 'react-dom/client';
import Phone from '../app/phone';
import RenderRecovery from '../app/render-recovery';
import '../app/globals.css';
import '../app/refinement.css';
import '../app/comfort.css';
import '../app/polish.css';
import '../app/settings.css';
import '../app/reference-sky.css';
import {installAndroidRuntime} from './runtime';
installAndroidRuntime();
createRoot(document.getElementById('root')!).render(<RenderRecovery><Phone ownerId="personal-device" appName="云笺听雨"/></RenderRecovery>);

