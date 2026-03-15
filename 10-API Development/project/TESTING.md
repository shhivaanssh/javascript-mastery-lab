## Testing the Habit Tracker API

Start the server first:
```bash
node src/server.js
```

---

### Auth

**Register**
```bash
curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alex","email":"alex@example.com","password":"password123"}' | jq
```

**Login — save the token**
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@example.com","password":"password123"}' \
  | jq -r '.data.token')

echo "Token: $TOKEN"
```

**Get current user**
```bash
curl -s http://localhost:3000/api/v1/me \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

### Habits

**Create a habit**
```bash
curl -s -X POST http://localhost:3000/api/v1/habits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Morning Run","description":"5km every day","frequency":"daily","color":"#22c55e"}' | jq
```

**List habits**
```bash
curl -s http://localhost:3000/api/v1/habits \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Update a habit**
```bash
curl -s -X PUT http://localhost:3000/api/v1/habits/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Evening Run","color":"#6366f1"}' | jq
```

**Delete (archive) a habit**
```bash
curl -s -X DELETE http://localhost:3000/api/v1/habits/1 \
  -H "Authorization: Bearer $TOKEN" -w "\nStatus: %{http_code}\n"
```

---

### Completions

**Log today as complete**
```bash
curl -s -X POST http://localhost:3000/api/v1/habits/1/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"note":"Felt great!"}' | jq
```

**Log a specific past date**
```bash
curl -s -X POST http://localhost:3000/api/v1/habits/1/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"date":"2026-03-01","note":"Backdated"}' | jq
```

**Undo today's completion**
```bash
curl -s -X DELETE http://localhost:3000/api/v1/habits/1/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}' -w "\nStatus: %{http_code}\n"
```

**View completion history + streak**
```bash
curl -s "http://localhost:3000/api/v1/habits/1/completions?limit=7" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

### Stats

**30-day stats**
```bash
curl -s "http://localhost:3000/api/v1/stats?days=30" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**7-day stats**
```bash
curl -s "http://localhost:3000/api/v1/stats?days=7" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.summary'
```

---

### Expected error responses

**Missing auth → 401**
```bash
curl -s http://localhost:3000/api/v1/habits | jq
# {"ok":false,"error":"Authentication required","code":"UNAUTHORIZED"}
```

**Invalid body → 422**
```bash
curl -s -X POST http://localhost:3000/api/v1/habits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":""}' | jq
# {"ok":false,"error":"Validation failed","code":"VALIDATION_ERROR","details":[...]}
```

**Duplicate completion → 409**
```bash
# Run the complete endpoint twice on the same day
curl -s -X POST http://localhost:3000/api/v1/habits/1/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" -d '{}' | jq
# {"ok":false,"error":"Already completed on this date","code":"CONFLICT"}
```

---

### Thunder Client (VS Code)

1. Install Thunder Client extension in VS Code
2. Create a new collection: "Habit Tracker API"
3. Add environment variable: `baseUrl = http://localhost:3000/api/v1`
4. After login, add environment variable: `token = <paste token>`
5. Set Authorization header on protected requests: `Bearer {{token}}`

### PowerShell (Windows)

```powershell
# Register
$body = '{"name":"Alex","email":"alex@example.com","password":"password123"}'
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/register" `
  -Method POST -ContentType "application/json" -Body $body

# Login and save token
$resp = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"alex@example.com","password":"password123"}'
$token = $resp.data.token

# List habits
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/habits" `
  -Headers @{ Authorization = "Bearer $token" }
```
