from pathlib import Path
p=Path('work/qa/night-theme.mjs');s=p.read_text(encoding='utf-8').replace('http://127.0.0.1:5173/signin-with-chatgpt?return_to=/','http://127.0.0.1:5175/').replace('outputs/暗夜','outputs/0.0.1暗夜');Path('work/qa/repair-theme.mjs').write_text(s,encoding='utf-8')
