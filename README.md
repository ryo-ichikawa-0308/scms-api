# scms-api(作成中)

ミニ契約管理システムAPI

[simple-contract-management-system](https://github.com/ryo-ichikawa-0308/simple-contract-management-system)のAPI実装を格納します。

API実装マニュアル(メインコンテンツ)及び、API実装のサンプルを資産に含みます。

## 設計と実装

本APIは、[Simple contract management system データベース定義標準仕様書](https://github.com/ryo-ichikawa-0308/scms-db-docs)のサンプルDB設計書と[Simple contract management system API設計標準仕様書](https://github.com/ryo-ichikawa-0308/scms-api-docs)のサンプルAPI設計書をインプットとし、[scms-prompt: AIガバナンスとコード自動生成のためのプロンプト集](https://github.com/ryo-ichikawa-0308/scms-prompts)のプロンプト群を用いて自動生成したスケルトンコードに、ビジネスロジックを人手で実装することで作成した。

本APIは、これらのドキュメント統制・AIガバナンスの実証サンプルである。

## AIとプログラマの責任分離

APIの実装にあたり、下記の通りAIとプログラマの責任範囲を定義した。

### AIの責務

AIの責務は、API設計とDB設計に従ってスケルトンコードの出力をするところまでとした。

### プログラマの責務

プログラマの責務は、ビジネスロジック・テストコードの実装と、API設計書のエンドポイント仕様を変えない範囲で下記の修正を行うこととした。

- 過剰なコメントの削除
- 空もしくはサロゲートキーのみといった、冗長なDTOの整理
- クラス名は異なるが、本質的に同じであるオブジェクトの統合
- モジュールクラスの整理
- 共通モジュール・サービスの実装

## 構成要素

| ファイル/ディレクトリ                      | 役割                     | 備考                                                                                                                  |
| ------------------------------------------ | ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| [api-tutorial.md](./docs/api-tutorial.md)  | API実装マニュアル        | APIのコーディングルール。                                                                                             |
| [scms-backend](./scms-backend)             | API本体                  | APIの実装コード。                                                                                                     |
| [test-command.md](./docs/test-commands.md) |API疎通テストコマンド     | APIの動作確認を行うcurlコマンド集。                                                                                          |
| README.md(本書)                            | ドキュメントの概要と構成 |                                                                                                                       |

(C)2025 Ryo ICHIKAWA
