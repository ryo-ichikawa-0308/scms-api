# API疎通コマンド

## ユーザー登録の疎通

```bash
curl -X POST \
     -i \
     -c /workspaces/sandbox/cookiejar.txt \
     -H "Content-Type: application/json" \
     --data '{"email": "yourmail@example.com", "password": "password"}' \
     http://localhost:3000/api/v1/users
```

## ログインAPIの疎通

```bash
curl -X POST \
     -i \
     -c /workspaces/sandbox/cookiejar.txt \
     -H "Content-Type: application/json" \
     --data '{"email": "yourmail@example.com", "password": "password"}' \
     http://localhost:3000/api/v1/auth/login
```

## ログアウトAPIの疎通

```bash
curl -X POST \
     -i \
     -c /workspaces/sandbox/cookiejar.txt \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer ACCES_TOKEN" \
     --compressed \
     -d '{}' \
     http://localhost:3000/api/v1/auth/logout
```

## トークンリフレッシュAPIの疎通

```bash
curl -X POST \
     -i \
     -c /workspaces/sandbox/cookiejar.txt \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer REFRESH_TOKEN" \
     --compressed \
     -d '{}' \
     http://localhost:3000/api/v1/auth/refresh
```
