import { FilterQuery, SortOrder, Model } from 'mongoose';
import { logger } from '../../utils/logger';

export interface PaginationOptions {
  skip: number;
  limit: number;
}

export interface SortOptions {
  field: string;
  order: 'ASC' | 'DESC';
}

export class BaseService {
  protected logger = logger;

  protected buildMongoSort(sort: SortOptions): Record<string, SortOrder> {
    const mongoSort: Record<string, SortOrder> = {};
    mongoSort[sort.field] = sort.order === 'ASC' ? 1 : -1;
    return mongoSort;
  }

  protected async findWithPagination<T>(
    model: Model<T>,
    filter: FilterQuery<T>,
    pagination: PaginationOptions,
    sort: Record<string, SortOrder>
  ): Promise<{ data: T[]; total: number }> {
    const [data, total] = await Promise.all([
      model.find(filter).sort(sort).skip(pagination.skip).limit(pagination.limit).lean(),
      model.countDocuments(filter)
    ]);

    return { data: data as T[], total };
  }

  protected handleError(operation: string, error: unknown): never {
    const message = error instanceof Error ? error.message : 'Unknown error';
    this.logger.error(`${operation} failed:`, error);
    throw new Error(`${operation}: ${message}`);
  }
}
