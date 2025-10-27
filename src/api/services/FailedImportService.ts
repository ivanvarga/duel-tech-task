import { FilterQuery } from 'mongoose';
import { BaseService, PaginationOptions, SortOptions } from './BaseService';
import { FailedImportModel } from '../models/FailedImport';
import { promises as fs } from 'fs';
import path from 'path';
import { config } from '../../config';
import { logger } from '../../utils/logger';

export interface FailedImportData {
  file_name: string;
  file_path: string;
  raw_data: string;
  error_type: 'json_parse_error' | 'validation_error' | 'transformation_error' | 'database_error';
  error_message: string;
  attempted_at: Date;
  retry_count: number;
  status: 'failed' | 'fixed' | 'retrying' | 'ignored';
  fixed_at?: Date;
  last_retry_at?: Date;
  notes?: string;
}

export class FailedImportService extends BaseService {
  async findAll(
    filter: FilterQuery<any>,
    pagination: PaginationOptions,
    sort: SortOptions
  ) {
    try {
      const mongoFilter: FilterQuery<any> = {};

      if (filter.q) {
        mongoFilter.$or = [
          { file_name: { $regex: filter.q, $options: 'i' } },
          { error_type: { $regex: filter.q, $options: 'i' } },
          { error_message: { $regex: filter.q, $options: 'i' } }
        ];
      }

      if (filter.error_type) {
        mongoFilter.error_type = filter.error_type;
      }

      if (filter.status) {
        mongoFilter.status = filter.status;
      }

      const mongoSort = this.buildMongoSort(sort);
      const result = await this.findWithPagination(
        FailedImportModel,
        mongoFilter,
        pagination,
        mongoSort
      );

      return {
        data: result.data.map(item => ({
          ...item,
          id: (item as any)._id.toString(),
          _id: (item as any)._id.toString()
        })),
        total: result.total
      };
    } catch (error) {
      this.handleError('FailedImportService.findAll', error);
    }
  }

  async findById(id: string) {
    try {
      const failedImport = await FailedImportModel.findById(id).lean();
      if (!failedImport) {
        throw new Error('Failed import not found');
      }

      return {
        ...failedImport,
        id: (failedImport as any)._id.toString(),
        _id: (failedImport as any)._id.toString()
      };
    } catch (error) {
      this.handleError('FailedImportService.findById', error);
    }
  }

  async create(data: Partial<FailedImportData>) {
    try {
      const failedImport = await FailedImportModel.create(data);
      return failedImport.toObject();
    } catch (error) {
      this.handleError('FailedImportService.create', error);
    }
  }

  async update(id: string, updates: Partial<FailedImportData>) {
    try {
      const failedImport = await FailedImportModel.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      ).lean();

      if (!failedImport) {
        throw new Error('Failed import not found');
      }

      return {
        ...failedImport,
        id: (failedImport as any)._id.toString(),
        _id: (failedImport as any)._id.toString()
      };
    } catch (error) {
      this.handleError('FailedImportService.update', error);
    }
  }

  async delete(id: string) {
    try {
      const failedImport = await FailedImportModel.findByIdAndDelete(id).lean();
      if (!failedImport) {
        throw new Error('Failed import not found');
      }

      // Delete the file from the failed directory
      if (config.storage.type === 'local' && config.storage.local) {
        const filePath = path.join(config.storage.local.path, 'failed', failedImport.file_name);

        try {
          await fs.unlink(filePath);
          logger.info(`Deleted failed import file: ${filePath}`);
        } catch (fileError) {
          // Log error but don't fail the deletion if file doesn't exist
          logger.warn(`Could not delete file ${filePath}:`, fileError);
        }
      }

      return {
        ...failedImport,
        id: (failedImport as any)._id.toString(),
        _id: (failedImport as any)._id.toString()
      };
    } catch (error) {
      this.handleError('FailedImportService.delete', error);
    }
  }

  async incrementRetryCount(id: string) {
    try {
      const failedImport = await FailedImportModel.findByIdAndUpdate(
        id,
        {
          $inc: { retry_count: 1 },
          $set: { last_retry_at: new Date(), status: 'retrying' }
        },
        { new: true }
      ).lean();

      return failedImport;
    } catch (error) {
      this.handleError('FailedImportService.incrementRetryCount', error);
    }
  }

  async markAsFixed(id: string) {
    try {
      const failedImport = await FailedImportModel.findByIdAndUpdate(
        id,
        {
          $set: { status: 'fixed', fixed_at: new Date() }
        },
        { new: true }
      ).lean();

      return failedImport;
    } catch (error) {
      this.handleError('FailedImportService.markAsFixed', error);
    }
  }

  async getStats() {
    try {
      const [total, byType, byStatus, recentFailures] = await Promise.all([
        FailedImportModel.countDocuments(),
        FailedImportModel.aggregate([
          { $group: { _id: '$error_type', count: { $sum: 1 } } }
        ]),
        FailedImportModel.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        FailedImportModel.find()
          .sort({ attempted_at: -1 })
          .limit(10)
          .select('file_name error_type attempted_at')
      ]);

      return {
        total,
        by_type: byType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>),
        by_status: byStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>),
        recent_failures: recentFailures
      };
    } catch (error) {
      this.handleError('FailedImportService.getStats', error);
    }
  }
}
