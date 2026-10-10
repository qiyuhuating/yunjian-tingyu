import type {Character,PhoneState} from './phone-model';
import {getProvider,providerBase,connectionKeySlot,type ProviderId} from './providers';

// The role card contains connection preferences only. Credentials live in the
// device's encrypted key store, never in chat history, exports or backups.
/** Bind every character-scoped credential to its canonical endpoint.
 * Never silently copy a legacy unbound role key to a new host. */
export function characterKeySlot(characterId:string,provider:ProviderId,baseURL=''){
 const preset=getProvider(provider),base=baseURL||preset.baseURL;
 let endpoint='';try{endpoint=base?providerBase(provider,base):'';}catch{/* Unsafe or incomplete edit: never bind to a real stored key. */}
 const official=preset.baseURL?providerBase(provider,preset.baseURL):'';
 const suffix=base&&!endpoint?':invalid':endpoint&&endpoint!==official?':'+endpoint:official?'':':unset';
 return 'character-ai:'+characterId+':'+provider+suffix;
}
export function characterConnection(state:PhoneState,character:Character,useDefault=false){
 const override=useDefault?undefined:character.aiConnection;
 if(!override)return {provider:state.provider,model:state.model,baseURL:state.baseURL,vision:state.vision,keyScope:'provider' as const,keySlot:connectionKeySlot(state.provider,state.baseURL),inherited:true};
 const preset=getProvider(override.provider);
 // A "compatible" role can target an arbitrary HTTPS host. Never reuse the
 // unrelated globally configured compatible key with that host.
 const baseURL=override.baseURL||preset.baseURL,ownKey=getProvider(override.provider).baseURL===''||override.keyScope==='character'||connectionKeySlot(override.provider,baseURL)!==override.provider;
 return {provider:override.provider,model:override.model,baseURL,vision:override.vision,keyScope:ownKey?'character' as const:'provider' as const,keySlot:ownKey?characterKeySlot(character.id,override.provider,baseURL):connectionKeySlot(override.provider,baseURL),inherited:false};
}
