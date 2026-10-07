import subprocess,json,pathlib
root=pathlib.Path('outputs/mori-phone').resolve();results=[]
checks=[('core',['node','scripts/verify-core.mjs']),('providers',['node','scripts/verify-providers.mjs']),('voice',['node','scripts/verify-voice.mjs']),('review-regressions',['node','scripts/verify-review.mjs']),('group-chat',['node','scripts/verify-group.mjs']),('typescript',['node','node_modules/typescript/bin/tsc','--noEmit','--noUnusedLocals','--noUnusedParameters']),('diff-whitespace',['git','diff','--check'])]
for name,cmd in checks:
 r=subprocess.run(cmd,cwd=root,capture_output=True,text=True,encoding='utf-8',errors='replace');row={'check':name,'exitCode':r.returncode}
 if r.stdout.strip():
  try:row['result']=json.loads(r.stdout)
  except ValueError:row['stdout']=r.stdout
 if r.returncode:row['stderr']=r.stderr
 results.append(row);print(json.dumps({'check':name,'exitCode':r.returncode,'passed':row.get('result',{}).get('passed')},ensure_ascii=False))
pathlib.Path('outputs/云笺听雨UI群聊自动检查.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
assert all(r['exitCode']==0 for r in results),results
