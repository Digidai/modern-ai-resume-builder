# Measures every role example in every template via the dev page /dev/fit (needs `npm run dev -- --port 3000`
# and Python Playwright). Writes {title: {level, fit}}; apply with: node scripts/roles-fit-apply.mjs <out.json>
# Usage: python3 scripts/roles-fit.py <titles.json> <out.json> [processes]
import json, sys, math, urllib.parse
from multiprocessing import Pool
from playwright.sync_api import sync_playwright
PAGE=1122.52; B="http://localhost:3000/dev/fit?"
def get(pg, **q):
    pg.goto(B+urllib.parse.urlencode(q)); pg.wait_for_selector("html[data-fit]", state="attached", timeout=60000)
    return json.loads(pg.evaluate("document.documentElement.dataset.fit"))
def solve(pg, title):
    level=None
    for _ in range(14):
        r=get(pg, title=title, auto=1, **({"level":level} if level is not None else {}))
        level=r["level"]; h=r["heights"]
        scales={k: max(0.85, math.floor(min(1,PAGE/v)*100)/100) for k,v in h.items() if v>PAGE+1.5}
        for _ in range(4):
            if not scales: return {"level":level,"fit":{}}
            v=get(pg, title=title, level=level, only=",".join(scales), scales=json.dumps(scales))["heights"]
            bad=[k for k,x in v.items() if x>PAGE+1.5]
            if not bad: return {"level":level,"fit":scales}
            if any(scales[k]<=0.85 for k in bad): break
            for k in bad: scales[k]=round(max(0.85, scales[k]-0.02),2)
        level+=1
    return {"level":level,"fit":scales,"unresolved":True}
def work(titles):
    out={}
    with sync_playwright() as p:
        br=p.chromium.launch(); pg=br.new_page(viewport={"width":1000,"height":1200})
        for t in titles:
            try: out[t]=solve(pg,t)
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
