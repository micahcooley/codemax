#!/usr/bin/env python3
"""Static import/export and qualified-call arity audit, NOT a Zag compiler.
Does not evaluate types, ownership, capabilities, code generation or runtime.
"""
import json,pathlib,re,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
FILES=list((ROOT/'backend').rglob('*.zag'))
TOKEN=re.compile(r'//[^\n]*|/\*[\s\S]*?\*/|"(?:\\.|[^"\\])*"|[A-Za-z_][A-Za-z_0-9]*|\d+|[^\s]')
def lex(s):return [m.group() for m in TOKEN.finditer(s) if not m.group().startswith(('//','/*'))]
def end(t,i):
 pairs={'(':')','[':']','{':'}'};stack=[pairs[t[i]]]
 for j in range(i+1,len(t)):
  if t[j] in pairs:stack.append(pairs[t[j]])
  elif t[j] in pairs.values():
   if not stack or t[j]!=stack.pop():raise ValueError('mismatched delimiters')
   if not stack:return j
 raise ValueError('unterminated delimiter')
def arity(t,i,j):
 k=i+1;count=0 if k==j else 1
 while k<j:
  if t[k] in ('(','[','{'):k=end(t,k)+1;continue
  if t[k]==',' and k+1<j:count+=1
  k+=1
 return count
exports={};parsed={};errors=[];checked=0
for p in FILES:
 raw=p.read_text();t=lex(raw);parsed[p]=(raw,t);ex={}
 for i,v in enumerate(t[:-3]):
  if v!='fn' or not re.fullmatch('[A-Za-z_]\\w*',t[i+1]):continue
  k=i+2
  if t[k]=='[':k=end(t,k)+1
  if t[k]=='(':ex[t[i+1]]=arity(t,k,end(t,k))
 exports[p]=ex
for p,(raw,t) in parsed.items():
 aliases={m[1]:(p.parent/m[0]).resolve() for m in re.findall(r'@import\("([^"\n]+)"\)\s+as\s+(\w+)',raw)}
 for i in range(len(t)-4):
  if t[i] not in aliases or t[i+1]!='.':continue
  module=aliases[t[i]];name=t[i+2];k=i+3
  if t[k]=='[':k=end(t,k)+1
  if t[k]!='(':continue
  expected=exports.get(module,{}).get(name);actual=arity(t,k,end(t,k));checked+=1
  if expected is None or expected!=actual:errors.append({'file':str(p.relative_to(ROOT)),'call':t[i]+'.'+name,'expected':expected,'actual':actual})
report={'scope':__doc__.strip(),'modules':len(FILES),'qualified_calls':checked,'errors':errors,'status':'PASS' if not errors else 'FAIL'}
(ROOT/'tests/evidence').mkdir(parents=True,exist_ok=True)
(ROOT/'tests/evidence/zag-static-contracts.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2));sys.exit(bool(errors))
