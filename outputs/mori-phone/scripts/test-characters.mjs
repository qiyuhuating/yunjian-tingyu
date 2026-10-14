export function ensureTestCharacters(state,count=2){
 while(state.characters.length<count){
  const index=state.characters.length,id=`test-character-${index}`;
  state.characters.push({...state.characters[0],id,name:`测试角色 ${index}`});
  state.threads[id]=[];
 }
 return state;
}
