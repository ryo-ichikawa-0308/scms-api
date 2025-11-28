# API疎通コマンド

## 前提

[メインプロジェクト](https://github.com/ryo-ichikawa-0308/simple-contract-management-system)で提供している開発環境で実行すること。

開発コンテナ起動時に、APIサーバーコンテナとDBサーバーコンテナが起動する。

- **コードのマウント:** API実装資産(ソースコード)は、Docker VolumeによってAPIサーバーコンテナの`/app`ディレクトリにマウントされる。
- **実行環境:** VS Codeのターミナルから、APIサーバーコンテナへ`http://localhost:3000`を介してアクセスすることで疎通試験が可能である。

## 事前準備

環境変数ファイル`.env`の`ACCESS_TOKEN_EXPIRES`を3600000(1時間)など長時間に設定しておくことで、ログイン後のトークン有効期限を延ばし、疎通試験を容易にする。

(オプション)下記のコマンドで、初期データを投入する。

```bash
cd /workspaces/api/scms-backend
npm run batch:init
```

初期データ投入コマンドは、ユーザー・サービス・ユーザー提供サービスの各テーブルに整合性の取れたデータを投入する。在庫はランダムに設定される。データ重複を検出した場合は投入済みとして処理中止(正常終了)する。

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

※戻り値でユーザーIDとアクセストークンが返ってくるので、コピーしておく。

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

※戻り値でサービスIDが返ってくるので、コピーしておく。

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

※戻り値でユーザー提供サービスIDが返ってくるので、コピーしておく。

## サービス一覧APIの疎通

```bash
curl -X POST \
     -i \
     -c /workspaces/sandbox/cookiejar.txt \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer ACCESS_TOKEN" \
     --compressed \
     -d '{"serviceName":"サービス"}' \
     http://localhost:3000/api/v1/user-services/list
```

## サービス詳細APIの疎通

```bash
curl -X GET \
     -i \
     -c /workspaces/sandbox/cookiejar.txt \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer ACCESS_TOKEN" \
     http://localhost:3000/api/v1/user-services/USER_SERVICE_UUID
```

## サービス契約APIの疎通

```bash
curl -X POST \
     -i \
     -c /workspaces/sandbox/cookiejar.txt \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer ACCESS_TOKEN" \
     --compressed \
     -d '{"userServiceId":"USER_SERVICE_ID", "quantity":5}' \
     http://localhost:3000/api/v1/contracts
```

※戻り値で契約IDが返ってくるので、コピーしておく。

## 契約一覧APIの疎通

```bash
curl -X POST \
     -i \
     -c /workspaces/sandbox/cookiejar.txt \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer ACCESS_TOKEN" \
     --compressed \
     -d '{"serviceName":"サービス"}' \
     http://localhost:3000/api/v1/contracts/list
```

## 契約詳細APIの疎通

```bash
curl -X GET \
     -i \
     -c /workspaces/sandbox/cookiejar.txt \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer ACCESS_TOKEN" \
     http://localhost:3000/api/v1/contracts/CONTRACT_UUID
```

## 解約APIの疎通

```bash
curl -X PATCH \
     -i \
     -c /workspaces/sandbox/cookiejar.txt \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer ACCESS_TOKEN" \
     http://localhost:3000/api/v1/contracts/CONTRACT_UUID
```
