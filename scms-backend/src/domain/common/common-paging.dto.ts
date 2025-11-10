import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { Exclude } from 'class-transformer';
/**
 * リスト系取得APIのリクエスト基底クラス
 * ページネーションに必要なフィールドを定義する。
 */
export class ListRequestBase {
  /** 取得位置 */
  @ValidateIf((o: ListRequestBase) => o.limit !== undefined)
  @IsInt({ message: '取得位置は数値で入力してください。' })
  @Min(0, { message: '取得位置は0以上で入力してください。' })
  offset?: number;

  /** 取得件数 */
  @ValidateIf((o: ListRequestBase) => o.offset !== undefined)
  @IsInt({ message: '取得件数は数値で入力してください。' })
  @Min(1, { message: '取得件数は1以上で入力してください。' })
  limit?: number;

  /** ソートキー */
  @ValidateIf((o: ListRequestBase) => o.sortOrder !== undefined)
  @IsNotEmpty({
    message: 'ソートキーが未指定です。ソート順を指定する場合は必須です。',
  })
  @IsString({ message: 'ソートキーは文字列で入力してください。' })
  sortBy?: string;

  /** ソート順 */
  @ValidateIf((o: ListRequestBase) => o.sortOrder !== undefined)
  @IsIn(['asc', 'desc'], {
    message: 'ソート順は"asc"または"desc"で入力してください。',
  })
  sortOrder?: string;
}

/**
 * リスト系取得APIのレスポンス基底クラス
 * ページネーションに必要なフィールドを定義する。
 */
export class ListResponseBase<T> {
  /** 検索条件にあてはまる総件数 */
  @IsNotEmpty({ message: '総件数は必須です。' })
  @IsInt({ message: '総件数は数値で入力してください。' })
  @Min(0, { message: '総件数は0以上で入力してください。' })
  totalCount: number;

  /** 総ページ数(サーバー側でMath.ceil(totalCount / limit) として計算) */
  @IsNotEmpty({ message: '総ページ数は必須です。' })
  @IsInt({ message: '総ページ数は数値で入力してください。' })
  @Min(1, { message: '総ページ数は1以上で入力してください。' })
  totalPages: number;

  /** ページ番号(サーバー側で(offset / limit) + 1 として計算) */
  @IsNotEmpty({ message: 'ページ番号は必須です。' })
  @IsInt({ message: 'ページ番号は数値で入力してください。' })
  @Min(1, { message: 'ページ番号は1以上で入力してください。' })
  currentPage: number;

  /** 取得位置(リクエストと同じ値) */
  @IsNotEmpty({ message: '取得位置は必須です。' })
  @IsInt({ message: '取得位置は数値で入力してください。' })
  @Min(0, { message: '取得位置は0以上で入力してください。' })
  offset: number;

  /** 取得件数(リクエストと同じ値) */
  @IsNotEmpty({ message: '取得件数は必須です。' })
  @IsInt({ message: '取得件数は数値で入力してください。' })
  @Min(1, { message: '取得件数は1以上で入力してください。' })
  limit: number;

  /** 取得されたデータリスト。派生クラスで具体的なプロパティ名をつけて再定義する。 */
  @Exclude()
  data?: T[];
}
