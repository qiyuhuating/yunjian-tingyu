import subprocess,pathlib,json,hashlib,datetime
results=[]
for script in ['repair-review','repair-summary','repair-theme','repair-csp','ui-group','repair-companion','audit-regressions','security-regressions']:
 r=subprocess.run(['node','work/qa/'+script+'.mjs'],capture_output=True,text=True,encoding='utf-8',errors='replace');row={'check':script,'exitCode':r.returncode,'verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'compiledAssetSha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in pathlib.Path('outputs/android/assets/web/assets').glob('*.js')}}
 if r.stdout.strip():
  try:row['result']=json.loads(r.stdout[r.stdout.find('{'):])
  except ValueError:row['stdout']=r.stdout
 if r.returncode:row['stderr']=r.stderr
 results.append(row);print(json.dumps({'check':script,'exitCode':r.returncode},ensure_ascii=False),flush=True)
pathlib.Path('outputs/云笺听雨系统隔离浏览器回归.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
assert all(r['exitCode']==0 for r in results),results
