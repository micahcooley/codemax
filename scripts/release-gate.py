#!/usr/bin/env python3
"""Fail closed: evidence admission is mandatory; source existence is not a gate."""
import json,pathlib,sys
root=pathlib.Path(__file__).resolve().parents[1]
data=json.loads((root/'docs/release-gates.json').read_text())
failed=[]
for gate in data['gates']:
    evidence=gate.get('evidence');path=(root/evidence).resolve() if isinstance(evidence,str) else None
    if gate.get('status')!='VERIFIED' or path is None or not path.is_relative_to(root) or not path.is_file():failed.append(gate['id'])
if failed:
    print(json.dumps({'release':'BLOCKED','unverified_gates':failed,'note':'No source-only or fixture-only release override.'},indent=2));sys.exit(1)
print('Every configured release gate has a referenced evidence file. Independent review of that evidence is still required.')
