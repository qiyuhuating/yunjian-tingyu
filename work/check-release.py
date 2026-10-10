import subprocess,json,pathlib
root=pathlib.Path('outputs/mori-phone').resolve();results=[]
checks=[('core',['node','scripts/verify-core.mjs']),('providers',['node','scripts/verify-providers.mjs']),('voice',['node','scripts/verify-voice.mjs']),('review-regressions',['node','scripts/verify-review.mjs']),('group-chat',['node','scripts/verify-group.mjs']),('context-and-core',['node','scripts/verify-context.mjs']),('typescript',['node','node_modules/typescript/bin/tsc','--noEmit','--noUnusedLocals','--noUnusedParameters']),('diff-whitespace',['git','diff','--check'])]
checks.insert(1,('api-connections',['node','scripts/verify-connections.mjs']))
checks.insert(2,('core-runtime',['node','scripts/verify-runtime.mjs']))
checks.insert(6,('reusable-character-card-library',['node','scripts/verify-card-library.mjs']))
checks.insert(6,('roleplay-and-worldbook',['node','scripts/verify-roleplay.mjs']))
checks.insert(6,('character-memory-and-cadence',['node','scripts/verify-companion.mjs']))
for name,cmd in checks:
 r=subprocess.run(cmd,cwd=root,capture_output=True,text=True,encoding='utf-8',errors='replace');row={'check':name,'exitCode':r.returncode}
 if r.stdout.strip():
  try:row['result']=json.loads(r.stdout)
  except ValueError:row['stdout']=r.stdout
 if r.returncode:row['stderr']=r.stderr
 results.append(row);print(json.dumps({'check':name,'exitCode':r.returncode,'passed':row.get('result',{}).get('passed')},ensure_ascii=False))
pathlib.Path('outputs/云笺听雨系统隔离自动检查.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8',newline='\n')
assert all(r['exitCode']==0 for r in results),results
