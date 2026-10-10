import type {Character,PhoneState} from './phone-model';
import {getProvider,connectionKeySlot,type ProviderId} from './providers';

// The role card contains connection preferences only. Credentials live in the
// device's encrypted key store, never in chat history, exports or backups.
export function characterKeySlot(characterId:string,provider:ProviderId){
 return 'character-ai:'+characterId+':'+provider;
}
export function characterConnection(state:PhoneState,character:Character,useDefault=false){
 const override=useDefault?undefined:character.aiConnection;
 if(!override)return {provider:state.provider,model:state.model,baseURL:state.baseURL,vision:state.vision,keyScope:'provider' as const,keySlot:connectionKeySlot(state.provider,state.baseURL),inherited:true};
 const preset=getProvider(override.provider);
 // A "compatible" role can target an arbitrary HTTPS host. Never reuse the
 // unrelated globally configured compatible key with that host.
 const baseURL=override.baseURL||preset.baseURL,ownKey=getProvider(override.provider).baseURL===''||override.keyScope==='character'||connectionKeySlot(override.provider,baseURL)!==override.provider;
 return {provider:override.provider,model:override.model,baseURL,vision:override.vision,keyScope:ownKey?'character' as const:'provider' as const,keySlot:ownKey?characterKeySlot(character.id,override.provider):connectionKeySlot(override.provider,baseURL),inherited:false};
}
