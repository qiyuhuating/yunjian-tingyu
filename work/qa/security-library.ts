import * as storage from '../../outputs/mori-phone/lib/local-phone';
import * as backup from '../../outputs/mori-phone/lib/local-backup';
import {freshState,stateSchema} from '../../outputs/mori-phone/lib/phone-model';
import {readAttachment} from '../../outputs/mori-phone/lib/attachment-text';
import {wireRequest} from '../../outputs/mori-phone/lib/provider-adapter';
import {parseCharacter} from '../../outputs/mori-phone/lib/character-import';
import {zipSync,strToU8} from '../../outputs/mori-phone/node_modules/fflate';
(window as any).securityLibrary={...storage,...backup,freshState,stateSchema,readAttachment,wireRequest,parseCharacter,zipSync,strToU8};
