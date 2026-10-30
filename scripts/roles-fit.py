# Measures every role example in every template via the dev page /dev/fit (needs `npm run dev -- --port 3000`
# and Python Playwright). Writes {title: {level, fit}} ({title: {fit, trim}} for letter); apply with:
# node scripts/roles-fit-apply.mjs <out.json> [letter]
# Usage: python3 scripts/roles-fit.py <titles.json> <out.json> [processes] [a4|letter]
import json, sys, math, urllib.parse
from multiprocessing import Pool
from playwright.sync_api import sync_playwright
PAPER=sys.argv[4] if len(sys.argv)>4 else "a4"
PAGE={"a4":1122.52,"letter":1056.0}[PAPER]; B="http://localhost:3000/dev/fit?paper="+PAPER+"&"
def get(pg, **q):
    pg.goto(B+urllib.parse.urlencode(q)); pg.wait_for_selector("html[data-fit]", state="attached", timeout=60000)
    return json.loads(pg.evaluate("document.documentElement.dataset.fit"))
def solve(pg, title):
    # Try the full example first: per-template scales alone (down to 0.85) often fit it, and trimming
    # deletes content. Only when that fails, trim (auto picks a starting level) and retry.
    level=0
    for attempt in range(15):
        r=get(pg, title=title, level=level) if attempt==0 else get(pg, title=title, auto=1, level=level)
        level=r.get("level",level); h=r["heights"]
        scales={k: max(0.85, math.floor(min(1,PAGE/v)*100)/100) for k,v in h.items() if v>PAGE+1.5}
        for _ in range(4):
            if not scales: return {"level":level,"fit":{}}
            v=get(pg, title=title, level=level, only=",".join(scales), scales=json.dumps(scales))["heights"]
            bad=[k for k,x in v.items() if x>PAGE+1.5]
            if not bad: return {"level":level,"fit":scales}
            if any(scales[k]<=0.85 for k in bad): break
            for k in bad: scales[k]=round(max(0.85, scales[k]-0.02),2)
        if attempt: level+=1
    return {"level":level,"fit":scales,"unresolved":True}
def fit_at(pg, title, level, only=None):
    """Per-template scales (>= 0.85) that fit one page at this trim level, and the templates that still don't."""
    q={"title":title,"level":level}
    if only: q["only"]=",".join(only)
    h=get(pg, **q)["heights"]
    scales={k: max(0.85, math.floor(min(1,PAGE/v)*100)/100) for k,v in h.items() if v>PAGE+1.5}
    for _ in range(6):
        if not scales: return {}, []
        v=get(pg, title=title, level=level, only=",".join(scales), scales=json.dumps(scales))["heights"]
        bad=[k for k,x in v.items() if x>PAGE+1.5]
        if not bad: return scales, []
        if all(scales[k]<=0.85 for k in bad): return {k:x for k,x in scales.items() if k not in bad}, bad
        for k in bad: scales[k]=round(max(0.85, scales[k]-0.02),2)
    return scales, [k for k in scales if k in bad]
def solve_letter(pg, title):
    # US Letter keeps the A4 content: scales first, and only the templates that still overflow at 0.85
    # get their own trim level (stored as `trimLetter`), so the other templates show the whole example.
    scales, hard = fit_at(pg, title, 0)
    trim={}
    for k in hard:
        for level in range(1, 14):
            s, bad = fit_at(pg, title, level, [k])
            if not bad:
                trim[k]=level
                if s.get(k): scales[k]=s[k]
                else: scales.pop(k, None)
                break
        else: return {"level":0,"fit":scales,"trim":trim,"unresolved":True}
    return {"level":0,"fit":scales,"trim":trim}
def work(titles):
    out={}
    with sync_playwright() as p:
        br=p.chromium.launch(); pg=br.new_page(viewport={"width":1000,"height":1200})
        for t in titles:
            try: out[t]=solve_letter(pg,t) if PAPER=="letter" else solve(pg,t)
            except Exception as e: out[t]={"error":str(e)[:200]}
        br.close()
    return out
if __name__=="__main__":
    titles=json.load(open(sys.argv[1])); n=int(sys.argv[3]) if len(sys.argv)>3 else 6
    chunks=[titles[i::n] for i in range(n)]
    res={}
    with Pool(n) as pool:
        for r in pool.imap_unordered(work, chunks): res.update(r)
    json.dump(res, open(sys.argv[2],"w"), indent=1)
    lv=[v.get("level",-1) for v in res.values()]
    print(len(res), "errors", sum(1 for v in res.values() if "error" in v), "unresolved", sum(1 for v in res.values() if v.get("unresolved")))
    from collections import Counter; print(sorted(Counter(lv).items()))
