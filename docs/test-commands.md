# API疎通コマンド

## 事前準備

環境変数ファイル`.env`の`ACCESS_TOKEN_EXPIRES`を3600000(1時間)など長時間に設定しておく。

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

※戻り値でユーザーIDとアクセストークンが返ってくるので、メモしておく。

## ログアウトAPIの疎通

```bash
curl -X POST \
     -i \
     -c /workspaces/sandbox/cookiejar.txt \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer ACCESS_TOKEN" \
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

## サービス登録APIの疎通

```bash
curl -X POST \
     -i \
     -c /workspaces/sandbox/cookiejar.txt \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer ACCESS_TOKEN" \
     --compressed \
     -d '{"name":"サービス001", "description":"何かをしてくれるサービス", "price":10000, "unit":"人月"}' \
     http://localhost:3000/api/v1/services
```

※戻り値でサービスIDが返ってくるので、メモしておく。

## ユーザー提供サービス登録APIの疎通

```bash
curl -X POST \
     -i \
     -c /workspaces/sandbox/cookiejar.txt \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer ACCESS_TOKEN" \
     --compressed \
     -d '{"userId":"YOUR_USER_ID", "serviceId":"YOUR_SERVICE_ID", "stock":10000}' \
     http://localhost:3000/api/v1/user-services
```

※戻り値でユーザー提供サービスIDが返ってくるので、メモしておく。
