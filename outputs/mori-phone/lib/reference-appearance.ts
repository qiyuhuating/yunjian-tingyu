import type {PhoneState} from './phone-model';

// Persisted with the state, so a later deliberate theme selection survives cold starts.
export function restoreReferenceAppearance(state:PhoneState):PhoneState {
 if(state.appearanceRevision===1)return state;
 return {...state,theme:'sky',appearanceRevision:1};
}
