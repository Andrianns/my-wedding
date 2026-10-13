# Graph Report - my-wedding  (2026-10-13)

## Corpus Check
- 10 files · ~44,387 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 93 nodes · 125 edges · 11 communities (9 shown, 2 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e22e43f3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Geom
- rsvp.js
- central_park_2_generator.py
- wedding-journey.js
- journey-smoke.mjs
- Central Park 2 + SOHO Podomoro City — 3D Wedding World (GLB)
- Undangan Pernikahan 3D
- central_park_2_soho_extension.py
- wedding-lobby.js
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `Geom` - 8 edges
2. `Model` - 8 edges
3. `Undangan Pernikahan 3D` - 8 edges
4. `Central Park 2 + SOHO Podomoro City — 3D Wedding World (GLB)` - 7 edges
5. `redis()` - 5 edges
6. `entriesFor()` - 5 edges
7. `submit()` - 5 edges
8. `summary()` - 4 edges
9. `fz()` - 4 edges
10. `palm()` - 4 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (11 total, 2 thin omitted)

### Community 0 - "Geom"
Cohesion: 0.23
Nodes (3): Geom, Model, palm()

### Community 1 - "rsvp.js"
Cohesion: 0.29
Nodes (12): ATT, clean(), entriesFor(), hashToObj(), K, page(), pub(), redis() (+4 more)

### Community 2 - "central_park_2_generator.py"
Cohesion: 0.27
Nodes (5): curved_line(), curved_panel(), fz(), Original, procedural, game-ready architectural approximation of Central Park Mal, vertical_line()

### Community 4 - "journey-smoke.mjs"
Cohesion: 0.29
Nodes (9): capture(), errors, evaluate(), page, pages, pending, send(), socket (+1 more)

### Community 5 - "Central Park 2 + SOHO Podomoro City — 3D Wedding World (GLB)"
Cohesion: 0.25
Nodes (7): Batasan teknis, Cara buka preview, Central Park 2 + SOHO Podomoro City — 3D Wedding World (GLB), Contoh di React Three Fiber / Three.js, Detail yang diprocedural di entrance SOHO, Isi file, Referensi publik

### Community 6 - "Undangan Pernikahan 3D"
Cohesion: 0.22
Nodes (8): Deploy, Ganti data undangan, Kontrol, Model dan perjalanan, Nama tamu di link, RSVP, kursi tamu, dan Ucapan, Tampilan mall dan pengujian, Undangan Pernikahan 3D

### Community 8 - "wedding-lobby.js"
Cohesion: 0.67
Nodes (5): builder(), createFoyer(), createLobby(), createTerrace(), elevator()

### Community 9 - "vercel.json"
Cohesion: 0.50
Nodes (3): git, deploymentEnabled, $schema

## Knowledge Gaps
- **22 isolated node(s):** `REDIS_URL`, `K`, `pages`, `page`, `socket` (+17 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Geom` connect `Geom` to `central_park_2_generator.py`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `Model` connect `Geom` to `central_park_2_generator.py`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `REDIS_URL`, `K`, `pages` to the rest of the system?**
  _22 weakly-connected nodes found - possible documentation gaps or missing edges._