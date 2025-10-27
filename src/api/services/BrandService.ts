import { FilterQuery } from 'mongoose';
import { BaseService, PaginationOptions, SortOptions } from './BaseService';
import { BrandModel } from '../models/Brand';
import { v5 as uuidv5 } from 'uuid';

const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

export interface BrandData {
  brand_id: string;
  name: string;
}

export class BrandService extends BaseService {
  async findAll(
    filter: FilterQuery<any>,
    pagination: PaginationOptions,
    sort: SortOptions
  ) {
    try {
      const mongoFilter: FilterQuery<any> = {};

      if (filter.q) {
        mongoFilter.$or = [
          { name: { $regex: filter.q, $options: 'i' } },
          { brand_id: { $regex: filter.q, $options: 'i' } }
        ];
      }

      if (filter.name) {
        mongoFilter.name = { $regex: filter.name, $options: 'i' };
      }

      const mongoSort = this.buildMongoSort(sort);
      const result = await this.findWithPagination(BrandModel, mongoFilter, pagination, mongoSort);

      return {
        data: result.data.map(brand => ({
          ...brand,
          id: (brand as any)._id.toString(),
          _id: (brand as any)._id.toString()
        })),
        total: result.total
      };
    } catch (error) {
      this.handleError('BrandService.findAll', error);
    }
  }

  async findById(id: string) {
    try {
      const brand = await BrandModel.findById(id).lean();
      if (!brand) {
        throw new Error('Brand not found');
      }

      return {
        ...brand,
        id: (brand as any)._id.toString(),
        _id: (brand as any)._id.toString()
      };
    } catch (error) {
      this.handleError('BrandService.findById', error);
    }
  }

  async findByBrandId(brandId: string) {
    try {
      const brand = await BrandModel.findOne({ brand_id: brandId }).lean();
      return brand;
    } catch (error) {
      this.handleError('BrandService.findByBrandId', error);
    }
  }

  async findOrCreate(brandName: string) {
    try {
      const brandId = uuidv5(brandName, NAMESPACE);

      const brand = await BrandModel.findOneAndUpdate(
        { brand_id: brandId },
        {
          $set: { name: brandName },
          $setOnInsert: { brand_id: brandId }
        },
        { upsert: true, new: true }
      ).lean();

      return brand;
    } catch (error) {
      this.handleError('BrandService.findOrCreate', error);
    }
  }

  async update(id: string, updates: Partial<BrandData>) {
    try {
      const brand = await BrandModel.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      ).lean();

      if (!brand) {
        throw new Error('Brand not found');
      }

      return {
        ...brand,
        id: (brand as any)._id.toString(),
        _id: (brand as any)._id.toString()
      };
    } catch (error) {
      this.handleError('BrandService.update', error);
    }
  }

  async delete(id: string) {
    try {
      const brand = await BrandModel.findByIdAndDelete(id).lean();
      if (!brand) {
        throw new Error('Brand not found');
      }

      return {
        ...brand,
        id: (brand as any)._id.toString(),
        _id: (brand as any)._id.toString()
      };
    } catch (error) {
      this.handleError('BrandService.delete', error);
    }
  }
}
