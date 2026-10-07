import {createRoot} from 'react-dom/client';
import Phone from '../app/phone';
import '../app/globals.css';
import '../app/refinement.css';
import '../app/comfort.css';
import {installAndroidRuntime} from './runtime';
installAndroidRuntime();
createRoot(document.getElementById('root')!).render(<Phone ownerId="personal-device" appName="云笺听雨"/>);
