import {splitRoleplayReply} from './roleplay';
import {parseGroupReply} from './group-chat';
import {parseMediaReply} from './media-contract';
export function conversationReply(reply:string,group=false,allowEmpty=false){
 const media=parseMediaReply(reply),parsed=splitRoleplayReply(media.text);
 const bubbles=!parsed.text.trim()&&allowEmpty?[]:group||/^<cloudlet-messages>/.test(parsed.text.trim())?parseGroupReply(parsed.text,allowEmpty):parsed.text.trim()?[parsed.text]:[];
 if(!group&&bubbles.length>4)throw new Error('日常回复最多四条；重要说明保持完整。');
 if(!bubbles.length&&!media.commands.length&&!allowEmpty)throw new Error('回复没有可显示的内容。');return {bubbles,suggestions:parsed.suggestions,commands:media.commands};
}
