import re, subprocess
from collections import defaultdict

files = defaultdict(lambda: defaultdict(int))
cur = None
BS = chr(92)
with open('lint-output.txt', encoding='utf-8') as f:
    for line in f:
        t = line.rstrip()
        s = t.strip()
        m = re.match(r'^([A-Za-z]:.*\.(?:ts|tsx|js|jsx))\s*$', s)
        if m:
            cur = m.group(1)
            continue
        if ' error ' in t and cur:
            m = re.search(r'\s([\w@-]+/[\w-]+)\s*$', t)
            if m:
                files[cur][m.group(1)] += 1

out = subprocess.check_output(['git', 'status', '--short'], text=True)
modified = set()
for line in out.splitlines():
    parts = line.strip().split(None, 1)
    if len(parts) == 2 and parts[0].strip().endswith('M'):
        modified.add(parts[1])

print('=== ARCHIVOS NO modified con errores (arreglar ahora) ===')
target_rules = ('jsx-a11y/control-has-associated-label', 'jsx-a11y/click-events-have-key-events')
for f in sorted(files, key=lambda x: -sum(files[x].values())):
    rel = f.replace(BS, '/').split('mpoints-tracker/')[-1]
    if rel in modified:
        continue
    relevant = {r: c for r, c in files[f].items() if r in target_rules}
    if relevant:
        detail = ', '.join(f'{c} {r.split("/")[-1]}' for r, c in sorted(relevant.items()))
        print(f"  {sum(relevant.values()):2d}  {rel}  ({detail})")
