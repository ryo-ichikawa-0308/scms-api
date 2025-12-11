# API実装ルール

## 1. 前提

- NestJS及びPrismaを使用する。それ以外のフレームワークを用いる場合は適宜読み替えが必要である。
- `schema.prisma`は、DB定義書をAI処理して作成したものを用いる。
- APIの実装コードは、API設計書をAI処理して作成したスケルトンコードに、ビジネスロジックを記述することで実装する。
- 本書に記載されていないコーディングルールは、一般的なTypeScriptの慣習に従うものとする。
- 実装例は、本プロジェクトで提示しているAPIの実装を参照されたい。

## 2. フォルダ構成

API実装コードは、エンタープライズアーキテクチャに基づき、下記のフォルダ構成で実装する。

- `src`
  - `domain`
    - エンドポイントとなるコントローラクラスと、登録・更新系APIのトランザクション管理を行うオーケストレーションクラスを格納する。
      - リクエスト・レスポンスに特定のオブジェクト型が定義されている場合、DTOをAIによって作成済みである。
      - コントローラクラスはAIによって作成済みであり、API定義書と紐づいているため、メソッド名などの仕様を変更するにはAPI定義書の修正を必要とする。
      - オーケストレーションクラスはAIで作成したスケルトンコードに、フロー制御とビジネスロジックの呼び出しを人手で実装する。
    - 各ドメインコンテキストごとにフォルダ分けされ、`DomainContextModule`モジュールとして、外部に機能を提供する。
  - `service`
    - ビジネスロジックを実装した、下記3種類のサービスクラスを格納する。
      - コントローラークラスから呼び出されてデータ取得のビジネスロジックを提供するサービスクラス。
      - オーケストレーションクラスから呼び出されて登録・更新・削除(論理削除/物理削除)のビジネスロジックを提供するサービスクラス。
      - DB処理と紐づかない機能(メール送信など)を提供するサービスクラス。
    - いずれも、AIで作成したスケルトンコードに、ビジネスロジックとエラーハンドリングを人手で実装する。
    - `domain`層のDTOと`database`層のDTOは、`service`のビジネスロジックによって詰め替えを行う。
    - ビジネスロジックは、機能コンテキストごとにフォルダ分けされ、`ServiceContextModule`モジュールとして、`domain`層のモジュールに機能を提供する。
  - `database`
    - DBのテーブルと1:1で紐づくDAO及びDTOを格納する。
    - DAOは基本メソッド(単純SELECT、単純COUNT、INSERT、UPDATE、SOFT-DELETE、DELETE)をAIによって作成済みである。
      - 登録・更新・削除の基本メソッドは、メソッド名、引数といった仕様を原則変えてはならない。
      - テーブル結合を含む複雑なSELECTは、基本メソッドを修正するか、新規に実装する。
    - DTOは単純SELECT用DTO、INSERT用DTOをAIによって作成済みである。テーブル結合を含むSELECTのDTOは、SELECTの軸になるテーブルのDTOに実装する(後述)。
    - すべてのDAOを纏めて、`DatabaseModule`モジュールとして`service`層のモジュールに機能を提供する。
  - `prisma`
    - `schema.prisma`を格納する。
    - Prisma接続サービスを`PrismaModule`モジュールとして`database`層のモジュールに機能を提供する。
    - `PrismaModule`モジュールは、`domain`層のオーケストレーションクラスに、トランザクション機能を提供する役割も持つ。

## 3. `domain`層の実装

### 3.1 取得系API(`POST/list` `GET`) コントローラークラス

取得系APIのコントローラーは、`service`層のビジネスロジックに直接処理を委譲する。

#### 3.1.1 リクエスト

クライアントから受け取ったリクエストDTOをビジネスロジックに引き渡す。

#### 3.1.2 レスポンス

ビジネスロジックから受け取ったレスポンスDTOをクライアントに返す。

### 3.2 更新系API(`POST` `PUT` `PATCH` `DELETE`) コントローラークラス

更新系APIのコントローラーは、オーケストレーションクラスにトランザクション処理とビジネスロジックの処理を委譲する。

#### 3.2.1 リクエスト

クライアントから受け取ったリクエストDTOをオーケストレーションクラスに引き渡す。単項目バリデーションは`class-validator`で自動的に行われるため、そのままオーケストレーションクラスに引き渡す。

#### 3.2.2 レスポンス

原則として、以下のレスポンスを返す。

- **登録API:** 登録したリソースのサロゲートキー(UUID)をクライアントに返す(201 CREATED)。
- **更新・削除API:** 何も返さない(204 NO CONTENT)。

但し、要件に応じて、適切なレスポンスDTOを定義することも可とする。

(補足) サンプルAPIでは、認証系のAPIにおいて、ユーザーテーブルのトークン情報更新とJWTトークン返却を行っている。更新系APIにレスポンスDTOを設定するのはこのような特殊な場合に限定するべきで、登録したデータを次ページで表示するといった要件では、戻り値のUUIDをもとに、BFF側で改めて1件取得APIを実行する設計を推奨する。

### 3.3 更新系API オーケストレーションクラス

オーケストレーションクラスは、`service`層のビジネスロジックで業務整合性チェックを行い、問題がなければ登録・更新のトランザクションを実行する。

トランザクション開始前に下記の情報を取得する。これらの情報は、監査項目(登録日時・登録者・更新日時・更新者)の設定情報となる。

- **ログイン中のユーザーID:** リクエストの認証情報から取得する。
- **トランザクション開始日時:** 現在日時を取得する。

### 3.4 例外処理(共通)

- `service`層以下で発生した例外は、そのまま呼び出し元に伝播させる。発生した例外はすべて適切なHTTP例外型(NotFoundExceptionなど)にラップされている前提とする。

### 3.5 リクエスト・レスポンスDTO(共通)

リクエスト・レスポンスのDTOは、AIによるスケルトンコード生成時に、あらかじめ命名規則({Resource}{Action}Request/ResponseDto)に従ったDTOが作成されているため、
これをそのまま使用する。登録系API(サロゲートキー直接返却)と更新系API(void)のレスポンスDTOは不要のため、自動生成されている場合は削除すること。

## 4. `service`層の実装

`service`層(serviceクラス)は、DBからのデータ取得、DBでの業務整合性確認が必要なバリデーション、DBへの登録・更新データの作成を行う。バリデーション結果に伴う処理の分岐や、トランザクション処理の実行順序は`domain`層(オーケストレーションクラス)が責任を持つ。

### 4.1 取得系メソッド

コントローラークラスまたはオーケストレーションクラスの業務整合性チェックから呼び出され、データ取得のビジネスロジックを提供する。

- **責務:** 取得系メソッドは、下記の責務を持つ。
  - コントローラークラスから受け取ったリクエストのDTOを検索用のDTOに詰め替える。
  - DAOの検索メソッドを実行して、結果を受け取る。
  - DAOから受け取ったデータ(Prismaモデル型)をレスポンスDTOに詰め替えて、コントローラークラスに返却する。
  - データが存在しない場合の処理(0件返却もしくはNotFoundException)。

- **DTO:** 検索用のDTOは、AIによるDAOのコード生成時に、あらかじめ命名規則(SelectTableNameDto)に従ったDTOが作成されている。これは基本メソッド向けのDTOのため、必要に応じて修正もしくは新規にDTOを作成する。

- **命名規則:** 配列取得のメソッドは`list`、1件取得のメソッドは`detail`がスケルトンコードとして提供されている。それ以外の取得系メソッドは要件に応じて作成する。

- **ページング情報作成:** 配列取得のメソッドでは、データ検索と同じ条件で件数取得を行い、ページング情報を作成する。サンプルAPIでは、ページング情報作成は共通処理として提供されている。

- **例外処理:** 下記の業務例外を発生させる。
  - **NotFoundException:** 1件取得で、DAOからの戻り値が`null`の場合

### 4.2 更新系メソッド

オーケストレーションクラスから呼び出され、登録・更新・削除のビジネスロジックを提供する。これらのメソッドはトランザクション内で実行される。業務整合性チェックは、事前に行われている前提である。

- **責務:** 更新系メソッドは、下記の責務を持つ。
  - 登録の場合
    - オーケストレーションクラスから受け取ったリクエストのDTOを登録用のDTOに詰め替える。
    - DAOの登録メソッドを実行する。
  - 更新の場合
    - 更新対象のレコードを取得して、リクエストDTOのデータで書き換える。
    - DAOの更新メソッドを実行する。
  - 論理削除の場合
    - 更新対象のレコードを取得して、削除フラグを設定する。
    - DAOの論理削除メソッドを実行する。
  - 物理削除の場合
    - 削除対象のレコードを取得する。
    - DAOの物理削除メソッドを実行する。

- **DTO:** DB登録用のDTOは、AIによるDAOのコード生成時に、あらかじめ命名規則(CreateTableNameDto)に従ったDTOが作成されているため、これをそのまま使用する。更新・論理削除はDTOは用いず、対象レコードをPrismaモデル型として取得し、そこに更新データを設定してDAOのメソッドに引き渡す。

- **命名規則:** API設計のアクションに応じて、`actionWithTx`がスケルトンコードとして提供されている。それ以外の更新系メソッドは要件に応じて作成する。

- **引数:** 第1引数にトランザクションオブジェクト、第2引数にユーザーID、第3引数にトランザクション日時、第4引数に更新用データを設定する。

- **戻り値:** 原則、下記の戻り値を返す。要件上必要な場合は、適切なDTOを返すことも可とする。
  - **登録メソッド:** 登録したテーブルのサロゲートキーを返す。
  - **更新メソッド:** 何も返さない(`Promise<void>`)。

- **ロック処理:** 更新・削除を行うリソースに対し、必ず関連DAOの`lockTableNameById`を呼び出してロックを取得してから処理を実行する。ロックが取得できない場合は、要件に応じて新規作成もしくはNotFoundExceptionの送出を行う。

- **監査項目の登録:** 下記の監査項目を登録する。
  - **登録処理:** 登録日時と登録者にオーケストレーションクラスから受け取ったトランザクション開始日時とユーザーIDを、削除フラグに`false`を設定する。
  - **更新・削除処理:** 更新日時と更新者にオーケストレーションクラスから受け取ったトランザクション開始日時とユーザーIDを、削除フラグは要件に応じて`true`/`false`を設定する。

- **例外処理:** 下記の業務例外を発生させる。
  - **ConflictException:** データ重複により登録できない場合
  - **NotFoundException:** 更新対象のデータが取得できない場合
  - **BadRequestException:** 業務上、更新できないデータが渡された場合(在庫量を超える発注数など)

### 4.3 外部連携・共通サービス

DB処理や業務ロジックとは独立した、メール送信や外部API連携、ログ記録などの機能を提供する。

- **責務:** システム外の機能とのインターフェース(例: SMTPサーバーへのメール送信、メッセージキューへの書き込み)。外部接続の詳細を隠蔽する。

- **命名規則:** クラス名は`{Function}Service`(例: `EmailService`)とする。メソッド名は要件に応じて作成する。

- **外部依存** DAOへの依存は行わないことを前提とする。DAOへの依存を行う場合は、CRUD系のサービスとして実装する。

## 5. `database`層の実装

`database`層(DAOクラス)は、データの永続化(DBへのCRUD)を行う。ビジネスロジックは`service`層が責任を持つため、DAOクラスにビジネスロジックを実装してはならない。また、AIによって提供されている基本メソッドのうち、要件上必要ないものは削除すること。

### 5.1 データ取得メソッド(`select`)

データ取得メソッドは、下記の通り基本メソッドが提供されている。要件に合うように取得条件・テーブル結合・取得条件を追加実装する。

#### 1件選択メソッド(サロゲートキー検索)

```TypeScript
/**
 * TableNameをIDで取得する
 * @param id TableNameのID
 * @returns 取得したテーブル
 */
selectTableNameById(id: string): Promise<TableName | null>{}
```

- selectTableNameByIdは、検索結果が0件の場合はnullを返す。0件の場合の処理(後続ロジック実行、NotFoundException)は呼び出し元のサービスクラスで行うため、DAOは感知しない。
  - selectTableNameByIdは、検索条件として、「論理削除されていないこと」(`isDeleted: false`)を必須とする。
  - 要件上、論理削除されているレコードの検索が必要な場合は、別途メソッドを定義する。
- selectTableNameは、下記のPrisma例外を処理する。
  - **接続エラーなど、予期せぬ例外** InternalServerErrorExceptionにラップして例外送出する。

#### リスト選択メソッド(検索条件指定)

```TypeScript
/**
 * TableNameを取得する
 * @param dto TableNameの検索用DTO
 * @returns 取得したテーブルの配列
 */
selectTableName(dto: SelectTableNameDto): Promise<TableName[]>{}
```

- selectTableNameは、検索結果が0件の場合は空の配列を返す。0件の場合の処理(後続ロジック実行、NotFoundException)は呼び出し元のサービスクラスで行うため、DAOは感知しない。
  - selectTableNameは、検索条件として、「論理削除されていないこと」(`isDeleted: false`)を必須とする。
  - 要件上、論理削除されているレコードの検索が必要な場合は、別途メソッドを定義する。
  - `offset`/`limit`が設定されている場合は`offset`の値を`skip`に、`limit`の値を`take`に設定する。
  - `sortBy`/`sortOrder`が設定されている場合は`orderBy`パラメータのキーに`sortBy`を、値に`sortOrder`を設定する。
    - 但し、`sortBy`のみが設定されていて、`sortOrder`が設定されていない場合は`sortOrder`の値を`asc`で補完する。
- selectTableNameは、下記のPrisma例外を処理する。
  - **接続エラーなど、予期せぬ例外** InternalServerErrorExceptionにラップして例外送出する。

#### 計数メソッド(検索条件指定)

```TypeScript
/**
 * TableNameの件数を取得する
 * @param dto TableNameの検索用DTO
 * @returns 取得したレコードの件数
 */
countTableName(dto: SelectTableNameDto): Promise<number>{}
```

- countTableNameは、検索条件に当てはまるデータが存在しない場合は0を返す。0の場合の処理(後続ロジック実行、NotFoundException)は呼び出し元のサービスクラスで行うため、DAOは感知しない。
  - countTableNameは、検索条件として、「論理削除されていないこと」(`isDeleted: false`)を必須とする。
  - 要件上、論理削除されているレコードの検索が必要な場合は、別途メソッドを定義する。
- countTableNameは、下記のPrisma例外を処理する。
  - **接続エラーなど、予期せぬ例外** InternalServerErrorExceptionにラップして例外送出する。

#### テーブル結合の実装

- テーブルDTOに、下記のようにPrismaモデルを結合した型として、テーブル結合型を定義する。
- テーブル結合型は、{TableName}DetailDtoまたは{TableName}With{Relation}Dtoのように、そのDTOが詳細情報や結合データを含むことがわかる命名規則とする。
- テーブル結合型からレスポンスDTOへの詰替えはサービスクラスで行う。

(サンプルAPIにおける実装例)

```typescript
/** 契約取得の型 */
export type ContractsDetailDto = Contracts & {
  users: Users;
  userServices: UserServices & {
    users: Users;
    services: Services;
  };
};
```

### 5.2 データ登録メソッド(`create`)

データ登録メソッドは、下記の通り基本メソッドが提供されている。関連テーブルを含めた同時登録(Nested Writes)は、サービス層との責任範囲が曖昧となるため、禁止する。

#### 登録メソッド

```TypeScript
/**
 * TableNameを新規登録する
 * @param dto TableNameの登録用DTO
 * @returns 登録したレコード
 */
createTableName(prismaTx: PrismaTransaction, dto: CreateTableNameDto): Promise<TableName>{}
```

- createTableNameは、データの登録そのものを担当し、登録における業務的な整合性は呼び出し元のサービスクラスが保証するため、DAOは感知しない。
- createTableNameにおいて、監査フィールドの正当性は呼び出し元のサービスクラスが保証するため、DAOは感知しない。
- createTableNameは、下記のPrisma例外を処理する。
  - **一意制約違反(P2002)** ConflictExceptionにラップして例外送出する。
  - **外部キー違反(P2003)** BadRequestExceptionにラップして例外送出する。
  - **接続エラーなど、予期せぬ例外** InternalServerErrorExceptionにラップして例外送出する。

### 5.3 データ更新・削除メソッド(`update` `delete`)

更新・削除メソッドは、下記とおり基本メソッドが提供されている。これらのメソッドを実行する前に、ビジネスロジック側であらかじめロック取得メソッドを実行し、更新・削除対象レコードのロックを取得していることが前提である。

更新・削除は、トランザクション内でのデータ整合性を優先し、サロゲートキーを用いて1件ずつ実施する(バルク処理は行わない)想定である。

また、関連テーブルを含めた同時更新(Nested Writes)は、サービス層との責任範囲が曖昧となるため、禁止する。

#### 更新メソッド

```TypeScript
/**
 * TableNameを更新する
 * @param prismaTx トランザクション
 * @param dto TableNameのPrisma型
 * @returns 更新したレコード
 */
updateTableName(prismaTx: PrismaTransaction, updateData: TableName): Promise<TableName>{}
```

- updateTableNameは、データの更新そのものを担当し、更新における業務的な整合性は呼び出し元のサービスクラスが保証するため、DAOは感知しない。
- updateTableNameにおいて、監査フィールドの正当性は呼び出し元のサービスクラスが保証するため、DAOは感知しない。
- updateTableNameは、下記のPrisma例外を処理する。
  - **一意制約違反(P2002)** ConflictExceptionにラップして例外送出する。
  - **外部キー違反(P2003)** BadRequestExceptionにラップして例外送出する。
  - **更新対象のレコードが見つからない** NotFoundExceptionにラップして例外送出する。
  - **接続エラーなど、予期せぬ例外** InternalServerErrorExceptionにラップして例外送出する。

#### 論理削除メソッド

```TypeScript
/**
 * TableNameを論理削除する
 * @param prismaTx トランザクション
 * @param id TableNameのID(主キー)
 * @param updatedAt トランザクション開始日時
 * @param updatedBy トランザクションを行うユーザーのID
 * @returns 論理削除したレコード
 */
softDeleteTableName(prismaTx: PrismaTransaction, id: string, updatedAt: Date, updatedBy: string): Promise<TableName>{}
```

- softDeleteTableNameは、データの論理削除そのものを担当し、論理削除における業務的な整合性は呼び出し元のサービスクラスが保証するため、DAOは感知しない。
- softDeleteTableNameは、引数で受け取った主キーと監査項目(updatedAt/updatedBy)を用いて、直接対象テーブルの削除フラグを`true`に設定する。また、監査項目の正当性は呼び出し元のサービスクラスが保証するため、DAOは感知しない。
- softDeleteTableNameは、下記のPrisma例外を処理する。
  - **論理削除対象のレコードが見つからない** NotFoundExceptionにラップして例外送出する。
  - **接続エラーなど、予期せぬ例外** InternalServerErrorExceptionにラップして例外送出する。

#### 物理削除メソッド

```TypeScript
/**
 * TableNameを物理削除する
 * @param prismaTx トランザクション
 * @param id TableNameのID(主キー)
 * @returns 物理削除したレコード
 */
hardDeleteTableName(prismaTx: PrismaTransaction, id: string): Promise<TableName>{}
```

- hardDeleteTableNameは、データの物理削除そのものを担当し、物理削除における業務的な整合性は呼び出し元のサービスクラスが保証するため、DAOは感知しない。
- hardDeleteTableNameは、下記のPrisma例外を処理する。
  - **外部キー違反(P2003)** BadRequestExceptionにラップして例外送出する。
  - **物理削除対象のレコードが見つからない** NotFoundExceptionにラップして例外送出する。
  - **接続エラーなど、予期せぬ例外** InternalServerErrorExceptionにラップして例外送出する。

### 5.4 テーブルロック取得

更新・削除を行うテーブルのDAOには、下記のロック取得メソッドを実装する。`$queryRaw`によるロック取得がDBMSに依存するため、ロック取得メソッドは手動で実装する。

```TypeScript
/**
   * TableNameのロックを取得する
   * @param prismaTx トランザクション
   * @param id ユーザーID
   * @returns ロックしたレコード
 */
lockableNameById(id: string): Promise<TableName | null>{}
```

- lockTableNameByIdは、`prismaTx.$queryRaw<TableName[]>`を用いて`SELECT FOR UPDATE`のSQLを直接実行する。
- lockTableNameByIdは、検索結果が0件の場合はnullを返す。0件の場合の処理(後続ロジック実行、NotFoundException)は呼び出し元のサービスクラスで行うため、DAOは感知しない。
  - lockTableNameByIdは、論理削除データ復活の前準備という可能性を考慮し、削除フラグを条件に含めない。
- lockTableNameByIdは、下記のPrisma例外を処理する。
  - **接続エラーなど、予期せぬ例外** InternalServerErrorExceptionにラップして例外送出する。

## 6. テストコード

- 実装したコードに対して、テストコードを作成する。
- テストコードの構成は、各メソッド＞正常系→異常系＞確認項目(`test`または`it`)の順に`describe`を構成する。
- テストコードを生成AIによって実装した場合、内容の正当性やカバレッジの確認を必ず実施すること。
- DTOのテストコードは、カスタムデコレータを実装していない場合は省略して良い。その場合、下記のように空テストを実装し、テストコードを省略したことを示す。

```typescript
describe('XxxxxDto (DTO) Test', () => {
  test('カスタムデコレータは実装していないためUT省略', () => {
    expect(true).toBe(true);
  });
});
```

## 7. その他

- 各メソッドには、処理概要(目的)、引数、戻り値を明記したヘッダコメントを必須とする。
- テストコードは、`describe`あるいは`test`/`it`を適切に記載することでヘッダコメントの代用とする。
- ロジックの流れが視認できるように、適宜ラインコメントを入れることを推奨する。
- コメントの記載とコードの内容に乖離があってはならない。また、一時的なコメントアウトを納品物に残してはならない。
