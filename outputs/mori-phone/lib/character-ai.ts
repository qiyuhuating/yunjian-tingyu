import type {Character,PhoneState} from './phone-model';
import {getProvider,type ProviderId} from './providers';

// The role card contains connection preferences only. Credentials live in the
// device's encrypted key store, never in chat history, exports or backups.
export function characterKeySlot(characterId:string,provider:ProviderId){
 return 'character-ai:'+characterId+':'+provider;
}
export function characterConnection(state:PhoneState,character:Character,useDefault=false){
 const override=useDefault?undefined:character.aiConnection;
 if(!override)return {provider:state.provider,model:state.model,baseURL:state.baseURL,vision:state.vision,keyScope:'provider' as const,keySlot:state.provider,inherited:true};
 const preset=getProvider(override.provider);
 // A "compatible" role can target an arbitrary HTTPS host. Never reuse the
 // unrelated globally configured compatible key with that host.
 const ownKey=override.provider==='compatible'||override.keyScope==='character';
 return {provider:override.provider,model:override.model,baseURL:override.provider==='compatible'?override.baseURL:preset.baseURL,vision:override.vision,keyScope:ownKey?'character' as const:'provider' as const,keySlot:ownKey?characterKeySlot(character.id,override.provider):override.provider,inherited:false};
}
