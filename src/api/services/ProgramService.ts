import { FilterQuery } from 'mongoose';
import { BaseService, PaginationOptions, SortOptions } from './BaseService';
import { ProgramModel } from '../models/Program';
import { BrandModel } from '../models/Brand';

export interface ProgramData {
  program_id: string;
  brand_id: string;
}

export class ProgramService extends BaseService {
  async findAll(
    filter: FilterQuery<any>,
    pagination: PaginationOptions,
    sort: SortOptions
  ) {
    try {
      const mongoFilter: FilterQuery<any> = {};

      if (filter.q) {
        mongoFilter.$or = [
          { program_id: { $regex: filter.q, $options: 'i' } },
          { brand_id: { $regex: filter.q, $options: 'i' } }
        ];
      }

      if (filter.brand_id) {
        mongoFilter.brand_id = filter.brand_id;
      }

      const mongoSort = this.buildMongoSort(sort);
      const result = await this.findWithPagination(ProgramModel, mongoFilter, pagination, mongoSort);

      const programs = await Promise.all(
        result.data.map(async (program) => {
          const brand = await BrandModel.findOne({ brand_id: program.brand_id }).lean();
          return {
            ...program,
            id: (program as any)._id.toString(),
            _id: (program as any)._id.toString(),
            brand_name: brand?.name || null
          };
        })
      );

      return {
        data: programs,
        total: result.total
      };
    } catch (error) {
      this.handleError('ProgramService.findAll', error);
    }
  }

  async findById(id: string) {
    try {
      const program = await ProgramModel.findById(id).lean();
      if (!program) {
        throw new Error('Program not found');
      }

      const brand = await BrandModel.findOne({ brand_id: program.brand_id }).lean();

      return {
        ...program,
        id: (program as any)._id.toString(),
        _id: (program as any)._id.toString(),
        brand_name: brand?.name || null
      };
    } catch (error) {
      this.handleError('ProgramService.findById', error);
    }
  }

  async findByProgramId(programId: string) {
    try {
      const program = await ProgramModel.findOne({ program_id: programId }).lean();
      return program;
    } catch (error) {
      this.handleError('ProgramService.findByProgramId', error);
    }
  }

  async upsert(programId: string, brandId: string) {
    try {
      const program = await ProgramModel.findOneAndUpdate(
        { program_id: programId },
        {
          $set: { brand_id: brandId },
          $setOnInsert: { program_id: programId }
        },
        { upsert: true, new: true }
      ).lean();

      return program;
    } catch (error) {
      this.handleError('ProgramService.upsert', error);
    }
  }

  async update(id: string, updates: Partial<ProgramData>) {
    try {
      const program = await ProgramModel.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      ).lean();

      if (!program) {
        throw new Error('Program not found');
      }

      return {
        ...program,
        id: (program as any)._id.toString(),
        _id: (program as any)._id.toString()
      };
    } catch (error) {
      this.handleError('ProgramService.update', error);
    }
  }

  async create(data: Partial<ProgramData>) {
    try {
      const program = await ProgramModel.create(data);
      return {
        ...program.toObject(),
        id: (program as any)._id.toString(),
        _id: (program as any)._id.toString()
      };
    } catch (error) {
      this.handleError('ProgramService.create', error);
    }
  }

  async delete(id: string) {
    try {
      const program = await ProgramModel.findByIdAndDelete(id).lean();
      if (!program) {
        throw new Error('Program not found');
      }

      return {
        ...program,
        id: (program as any)._id.toString(),
        _id: (program as any)._id.toString()
      };
    } catch (error) {
      this.handleError('ProgramService.delete', error);
    }
  }
}
