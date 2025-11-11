# APIのコマンド

APIの実証を行う上でのコマンド集

## 新しいユーザーを作る

```bash
curl -X POST \
  http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{ "name": "YOUR_NAME", "email": "yourname@example.com", "password": "password" }' \
  -i
```

※パスワードを一律「password」で設定する。

## ログインする

```bash
curl -X POST \
  http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "yourname@example.com", "password": "password" }' \
  -i
```

※ここでレスポンスに出力されたトークンを、今後のコマンドの`{TOKEN}`に置き換える。

## ログアウトする

```bash
curl -X POST 'http://localhost:3000/api/v1/auth/logout' \
  -H 'Authorization: Bearer {TOKEN}' \
  -H 'Content-Type: application/json' \
  -i
```
