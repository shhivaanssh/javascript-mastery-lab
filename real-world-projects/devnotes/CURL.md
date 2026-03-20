# DevNotes API — curl reference

Start the server first: `node src/server.js`

---

## Notes

**Create a note**
```bash
curl -s -X POST http://localhost:4000/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Array reduce explained",
    "body": "reduce((acc, val) => acc + val, 0)",
    "language": "javascript",
    "tags": ["js", "arrays", "functional"]
  }' | jq
```

**Create a pinned note**
```bash
curl -s -X POST http://localhost:4000/api/notes \
  -H "Content-Type: application/json" \
  -d '{"title":"Git cheatsheet","body":"git stash, git bisect","pinned":true,"tags":["git"]}' | jq
```

**List all notes**
```bash
curl -s http://localhost:4000/api/notes | jq
```

**Filter by language**
```bash
curl -s "http://localhost:4000/api/notes?lang=javascript" | jq '.data[].title'
```

**Filter by tag**
```bash
curl -s "http://localhost:4000/api/notes?tag=git" | jq
```

**Show only pinned**
```bash
curl -s "http://localhost:4000/api/notes?pinned=1" | jq '.data[].title'
```

**Full-text search**
```bash
curl -s "http://localhost:4000/api/notes?q=reduce" | jq
```

**Combined search + tag filter**
```bash
curl -s "http://localhost:4000/api/notes?q=git&tag=git" | jq
```

**Pagination**
```bash
curl -s "http://localhost:4000/api/notes?page=1&limit=5" | jq '.meta'
curl -s "http://localhost:4000/api/notes?page=2&limit=5" | jq '.meta'
```

**Get one note**
```bash
curl -s http://localhost:4000/api/notes/1 | jq
```

**Update a note (partial — only send fields to change)**
```bash
curl -s -X PUT http://localhost:4000/api/notes/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Array reduce — deep dive","pinned":true}' | jq
```

**Replace tags**
```bash
curl -s -X PUT http://localhost:4000/api/notes/1 \
  -H "Content-Type: application/json" \
  -d '{"tags":["js","must-know"]}' | jq '.data.tags'
```

**Clear all tags**
```bash
curl -s -X PUT http://localhost:4000/api/notes/1 \
  -H "Content-Type: application/json" \
  -d '{"tags":[]}' | jq '.data.tags'
```

**Delete a note**
```bash
curl -s -X DELETE http://localhost:4000/api/notes/1 -w "\nStatus: %{http_code}\n"
```

---

## Tags

**List all tags with note counts**
```bash
curl -s http://localhost:4000/api/tags | jq
```

---

## Error responses

**Missing title → 422**
```bash
curl -s -X POST http://localhost:4000/api/notes \
  -H "Content-Type: application/json" \
  -d '{"body":"no title"}' | jq
```

**Not found → 404**
```bash
curl -s http://localhost:4000/api/notes/999 | jq
```

---

## PowerShell (Windows)

```powershell
# Create a note
$body = '{"title":"Closure example","body":"function outer() { let x=1; return ()=>x }","language":"javascript","tags":["js","closures"]}'
Invoke-RestMethod -Uri "http://localhost:4000/api/notes" -Method POST -ContentType "application/json" -Body $body

# List notes
Invoke-RestMethod -Uri "http://localhost:4000/api/notes" | Select-Object -ExpandProperty data

# Search
Invoke-RestMethod -Uri "http://localhost:4000/api/notes?q=closure" | Select-Object -ExpandProperty data

# List tags
Invoke-RestMethod -Uri "http://localhost:4000/api/tags" | Select-Object -ExpandProperty data
```
