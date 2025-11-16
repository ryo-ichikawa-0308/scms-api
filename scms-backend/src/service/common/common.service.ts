import { Injectable } from '@nestjs/common';
import { ListResponseBase } from 'src/domain/common/common-paging.dto';

/**
 * サービス層で使う共通処理クラス
 */
@Injectable()
export class CommonService {
  /**
   * レスポンス時のページング情報を計算する。
   */
  calcResponsePaging(
    totalCount: number,
    offset?: number,
    limit?: number,
  ): ListResponseBase<any> {
    const totalPages = limit ? Math.ceil(totalCount / limit) : totalCount;
    const currentPage = (offset ?? 0) / (limit ?? 1) + 1;
    return {
      offset: offset,
      limit: limit,
      totalCount: totalCount,
      totalPages: totalPages,
      currentPage: currentPage,
    } as ListResponseBase<any>;
  }
}
