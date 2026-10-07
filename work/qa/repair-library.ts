import * as storage from '../../outputs/mori-phone/lib/local-phone';
import * as backup from '../../outputs/mori-phone/lib/local-backup';
import {freshState} from '../../outputs/mori-phone/lib/phone-model';
import {createElement,useState} from '../../outputs/mori-phone/node_modules/react';
import {createRoot} from '../../outputs/mori-phone/node_modules/react-dom/client';
import {PhoneContext} from '../../outputs/mori-phone/app/ui';
import {useVoice} from '../../outputs/mori-phone/app/use-voice';
function Reader({name}:{name:string}){const voice=useVoice();return createElement('button',{'data-playing':String(voice.playing),onClick:()=>void voice.read(name)},'test-reader-'+name);}
function VoiceFixture(){const [a,setA]=useState(true),[b,setB]=useState(true);return createElement(PhoneContext.Provider,{value:{ownerId:'voice-test',state:freshState(),toast:()=>{}} as any},a&&createElement(Reader,{name:'A'}),b&&createElement(Reader,{name:'B'}),createElement('button',{onClick:()=>setA(false)},'remove-A'),createElement('button',{onClick:()=>setB(false)},'remove-B'));}
function mountVoice(){const node=document.createElement('div');document.body.append(node);const root=createRoot(node);root.render(createElement(VoiceFixture));return()=>{root.unmount();node.remove();};}
(window as any).repairLibrary={...storage,...backup,freshState,mountVoice};
