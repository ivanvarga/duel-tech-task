import { FilterQuery } from 'mongoose';
import { BaseService, PaginationOptions, SortOptions } from './BaseService';
import { UserModel } from '../models/User';
import { ProgramMembershipModel } from '../models/ProgramMembership';
import { BrandModel } from '../models/Brand';

export interface UserFilter {
  q?: string;
  email?: string;
}

export interface UserData {
  user_id: string;
  name: string;
  email?: string | null;
  instagram_handle?: string | null;
  tiktok_handle?: string | null;
  joined_at?: Date | null;
  status?: string;
  data_quality?: {
    is_clean: boolean;
    issues: string[];
    severity: 'clean' | 'warning' | 'error';
  };
}

export class UserService extends BaseService {
  async findAll(
    filter: UserFilter,
    pagination: PaginationOptions,
    sort: SortOptions
  ) {
    try {
      const mongoFilter: FilterQuery<any> = {};

      if (filter.q) {
        mongoFilter.$or = [
          { name: { $regex: filter.q, $options: 'i' } },
          { email: { $regex: filter.q, $options: 'i' } },
          { user_id: { $regex: filter.q, $options: 'i' } }
        ];
      }

      if (filter.email) {
        mongoFilter.email = { $regex: filter.email, $options: 'i' };
      }

      const mongoSort = this.buildMongoSort(sort);
      const result = await this.findWithPagination(UserModel, mongoFilter, pagination, mongoSort);

      return {
        data: result.data.map(user => ({
          ...user,
          id: (user as any)._id.toString(),
          _id: (user as any)._id.toString()
        })),
        total: result.total
      };
    } catch (error) {
      this.handleError('UserService.findAll', error);
    }
  }

  async findById(id: string) {
    try {
      const user = await UserModel.findById(id).lean();
      if (!user) {
        throw new Error('User not found');
      }

      const memberships = await ProgramMembershipModel.find({ user_id: user.user_id }).lean();
      const brandIds = memberships.map(m => m.brand_id);
      const brands = await BrandModel.find({ brand_id: { $in: brandIds } }).lean();
      const brandMap = new Map(brands.map(b => [b.brand_id, b]));

      const advocacy_programs = memberships.map(membership => {
        const brand = brandMap.get(membership.brand_id);
        return {
          program_id: membership.program_id,
          brand: brand?.name || null,
          total_sales_attributed: membership.sales_attributed || 0,
          tasks_completed: membership.tasks_completed || 0
        };
      });

      return {
        ...user,
        id: (user as any)._id.toString(),
        _id: (user as any)._id.toString(),
        advocacy_programs
      };
    } catch (error) {
      this.handleError('UserService.findById', error);
    }
  }

  async findByUserId(userId: string) {
    try {
      const user = await UserModel.findOne({ user_id: userId }).lean();
      return user;
    } catch (error) {
      this.handleError('UserService.findByUserId', error);
    }
  }

  async create(userData: UserData) {
    try {
      const user = await UserModel.create(userData);
      return user.toObject();
    } catch (error) {
      this.handleError('UserService.create', error);
    }
  }

  async upsert(userId: string, userData: Partial<UserData>) {
    try {
      // Exclude user_id from $set to avoid conflict with $setOnInsert
      const { user_id: _user_id, ...dataToSet } = userData;

      const user = await UserModel.findOneAndUpdate(
        { user_id: userId },
        {
          $set: dataToSet,
          $setOnInsert: { user_id: userId }
        },
        { upsert: true, new: true }
      ).lean();

      return user;
    } catch (error) {
      this.handleError('UserService.upsert', error);
    }
  }

  async update(id: string, updates: Partial<UserData>) {
    try {
      const user = await UserModel.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      ).lean();

      if (!user) {
        throw new Error('User not found');
      }

      return {
        ...user,
        id: (user as any)._id.toString(),
        _id: (user as any)._id.toString()
      };
    } catch (error) {
      this.handleError('UserService.update', error);
    }
  }

  async delete(id: string) {
    try {
      const user = await UserModel.findByIdAndDelete(id).lean();
      if (!user) {
        throw new Error('User not found');
      }

      return {
        ...user,
        id: (user as any)._id.toString(),
        _id: (user as any)._id.toString()
      };
    } catch (error) {
      this.handleError('UserService.delete', error);
    }
  }
}
