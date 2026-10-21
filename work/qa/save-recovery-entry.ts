import {readLocal,getAsset} from '../../outputs/mori-phone/lib/local-phone';
import {readBackup} from '../../outputs/mori-phone/lib/local-backup';
(window as any).recoveryQA={readLocal,getAsset,readBackup};
