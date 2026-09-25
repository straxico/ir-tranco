import sys
import json
import sqlite3
import urllib.request
import time

import os

# Resolve DB path relative to current workspace or fall back to /data
script_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(script_dir, 'public', 'data', 'iran_domains.db')
if not os.path.exists(db_path):
    db_path = '/data/iran_domains.db'

def get_db():
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def fetch_and_cache_tranco(domain):
    url = f"https://tranco-list.eu/api/ranks/domain/{domain}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=6) as res:
            if res.status == 200:
                data = json.loads(res.read().decode())
                ranks = data.get('ranks', [])
                if ranks:
                    cur_rank = ranks[0]['rank']
                    peak_rank = min(r['rank'] for r in ranks)
                    peak_item = next(r for r in ranks if r['rank'] == peak_rank)
                    oldest_rank = ranks[-1]['rank']
                    change_1y = oldest_rank - cur_rank
                    ranks_json = json.dumps(ranks)
                    now_str = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
                    
                    conn = get_db()
                    c = conn.cursor()
                    c.execute("""
                        UPDATE domains 
                        SET current_rank = ?, 
                            peak_rank = ?, 
                            peak_date = ?, 
                            rank_1y_change = ?,
                            cached_ranks_json = ?, 
                            tranco_live = 1, 
                            cached_at = ?
                        WHERE domain = ?
                    """, (cur_rank, peak_rank, peak_item['date'], change_1y, ranks_json, now_str, domain))
                    conn.commit()
                    conn.close()
                    return ranks
    except Exception as e:
        pass
    return None

def query_domain(domain):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM domains WHERE domain = ?", (domain,))
    row = c.fetchone()
    
    if not row:
        conn.close()
        # Not even in 127k list, attempt live Tranco
        ranks = fetch_and_cache_tranco(domain)
        # re-check or return None
        return None
        
    row_dict = dict(row)
    
    # If not live fetched from Tranco or ranks empty, fetch from Tranco now!
    if not row_dict.get('tranco_live') or not row_dict.get('cached_ranks_json'):
        ranks = fetch_and_cache_tranco(domain)
        if ranks:
            c.execute("SELECT * FROM domains WHERE domain = ?", (domain,))
            new_row = c.fetchone()
            if new_row:
                row_dict = dict(new_row)
                
    conn.close()
    return row_dict

if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'get_domain':
        d = sys.argv[2].lower()
        res = query_domain(d)
        print(json.dumps(res))
    elif cmd == 'search':
        # args: category, query, sort, limit, offset
        cat = sys.argv[2] if len(sys.argv) > 2 else 'all'
        q = sys.argv[3] if len(sys.argv) > 3 else ''
        sort = sys.argv[4] if len(sys.argv) > 4 else 'rank_asc'
        limit = int(sys.argv[5]) if len(sys.argv) > 5 else 60
        offset = int(sys.argv[6]) if len(sys.argv) > 6 else 0
        
        conn = get_db()
        c = conn.cursor()
        
        where = []
        params = []
        if cat and cat != 'all':
            where.append("category = ?")
            params.append(cat)
        if q and q.strip():
            where.append("(domain LIKE ? OR title_fa LIKE ? OR title_en LIKE ? OR provider LIKE ?)")
            pat = f"%{q.strip().lower()}%"
            params.extend([pat, pat, pat, pat])
            
        where_str = ("WHERE " + " AND ".join(where)) if where else ""
        
        # Count total
        c.execute(f"SELECT COUNT(*) FROM domains {where_str}", params)
        total = c.fetchone()[0]
        
        # Order by
        order_str = "ORDER BY tranco_live DESC, current_rank ASC"
        if sort == 'rank_desc':
            order_str = "ORDER BY current_rank DESC"
        elif sort == 'growth_1y':
            order_str = "ORDER BY rank_1y_change DESC"
        elif sort == 'drop_1y':
            order_str = "ORDER BY rank_1y_change ASC"
        elif sort == 'name_fa':
            order_str = "ORDER BY title_fa ASC"
        elif sort == 'name_en':
            order_str = "ORDER BY domain ASC"
            
        c.execute(f"SELECT * FROM domains {where_str} {order_str} LIMIT ? OFFSET ?", params + [limit, offset])
        rows = [dict(r) for r in c.fetchall()]
        conn.close()
        
        print(json.dumps({"total": total, "items": rows}))
    elif cmd == 'categories':
        conn = get_db()
        c = conn.cursor()
        c.execute("SELECT category, COUNT(*) as cnt, MIN(current_rank) as top_rank FROM domains GROUP BY category")
        rows = [dict(r) for r in c.fetchall()]
        conn.close()
        print(json.dumps(rows))
    elif cmd == 'stats':
        conn = get_db()
        c = conn.cursor()
        c.execute("SELECT COUNT(*) FROM domains")
        total = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM domains WHERE tranco_live = 1")
        live = c.fetchone()[0]
        conn.close()
        print(json.dumps({"total": total, "live": live}))
