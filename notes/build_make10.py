# 用法：python3 build_make10.py 範本.html 輸出.html 讀音表 字型.ttf
import re, sys, json, base64, subprocess, tempfile, os
tpl, out, table, ttf = sys.argv[1:5]
s = open(tpl, encoding='utf-8').read()
zy = re.search(r'const ZY = \{(.*?)\};', s, re.S).group(1)
words = re.search(r'const WORDS = \{(.*?)\};', s, re.S).group(1)
chars = sorted(set(re.findall(r"'([㐀-鿿])'", zy)) | set(''.join(re.findall(r"'([㐀-鿿]+)'", words))))
tab = {}
for line in open(table, encoding='utf-8'):
    p = line.rstrip('\n').split('\t')
    if len(p) >= 4 and len(p[0]) == 1: tab.setdefault(p[0], p[3:])
bp = {c: tab[c] for c in chars}
# 檢查表裡的讀音都在字型的讀音清單裡
for m in re.finditer(r"'([㐀-鿿])':'([^']+)'", zy):
    assert m.group(2) in bp[m.group(1)], m.group(0)
for m in re.finditer(r"'([㐀-鿿]+)':'([^']+)'", words):
    for c, py in zip(m.group(1), m.group(2).split(' ')):
        assert c == '一' or py in bp[c], (c, py)
with tempfile.TemporaryDirectory() as d:
    open(f'{d}/c.txt', 'w', encoding='utf-8').write(''.join(chars))
    subprocess.run(['pyftsubset', ttf, f'--text-file={d}/c.txt', '--unicodes=U+E01E0-E01E5,U+FF0C,U+FF1F,U+FF01',
                    '--flavor=woff2', '--layout-features=*', f'--output-file={d}/f.woff2'], check=True)
    font = base64.b64encode(open(f'{d}/f.woff2', 'rb').read()).decode()
s = s.replace('__BPMF__', json.dumps(bp, ensure_ascii=False)).replace('__FONT__', font)
open(out, 'w', encoding='utf-8').write(s)
print(len(chars), 'chars, font', len(font)//1024, 'KB base64')
