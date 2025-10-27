import { FilterQuery } from 'mongoose';
import { BaseService, PaginationOptions, SortOptions } from './BaseService';
import { ProgramMembershipModel } from '../models/ProgramMembership';
import { UserModel } from '../models/User';
import { ProgramModel } from '../models/Program';
import { BrandModel } from '../models/Brand';
import { v5 as uuidv5 } from 'uuid';

const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

export interface ProgramMembershipData {
  membership_id: string;
  program_id: string;
  user_id: string;
  brand_id: string;
  joined_at: Date;
  tasks_completed: number;
  sales_attributed: number;
}

export class ProgramMembershipService extends BaseService {
  async findAll(
    filter: FilterQuery<any>,
    pagination: PaginationOptions,
    sort: SortOptions
  ) {
    try {
      const mongoFilter: FilterQuery<any> = {};

      if (filter.q) {
        mongoFilter.$or = [
          { membership_id: { $regex: filter.q, $options: 'i' } },
          { user_id: { $regex: filter.q, $options: 'i' } },
          { program_id: { $regex: filter.q, $options: 'i' } }
        ];
      }

      if (filter.user_id) {
        mongoFilter.user_id = filter.user_id;
      }

      if (filter.program_id) {
        mongoFilter.program_id = filter.program_id;
      }

      const mongoSort = this.buildMongoSort(sort);
      const result = await this.findWithPagination(
        ProgramMembershipModel,
        mongoFilter,
        pagination,
        mongoSort
      );

      const memberships = await Promise.all(
        result.data.map(async (membership) => {
          const [user, program, brand] = await Promise.all([
            UserModel.findOne({ user_id: membership.user_id }).lean(),
            ProgramModel.findOne({ program_id: membership.program_id }).lean(),
            BrandModel.findOne({ brand_id: membership.brand_id }).lean()
          ]);

          return {
            ...membership,
            id: (membership as any)._id.toString(),
            _id: (membership as any)._id.toString(),
            user_name: user?.name || null,
            brand_name: brand?.name || null
          };
        })
      );

      return {
        data: memberships,
        total: result.total
      };
    } catch (error) {
      this.handleError('ProgramMembershipService.findAll', error);
    }
  }

  async findById(id: string) {
    try {
      const membership = await ProgramMembershipModel.findById(id).lean();
      if (!membership) {
        throw new Error('Program membership not found');
      }

      const [user, program, brand] = await Promise.all([
        UserModel.findOne({ user_id: membership.user_id }).lean(),
        ProgramModel.findOne({ program_id: membership.program_id }).lean(),
        BrandModel.findOne({ brand_id: membership.brand_id }).lean()
      ]);

      return {
        ...membership,
        id: (membership as any)._id.toString(),
        _id: (membership as any)._id.toString(),
        user_name: user?.name || null,
        brand_name: brand?.name || null
      };
    } catch (error) {
      this.handleError('ProgramMembershipService.findById', error);
    }
  }

  async findByUser(userId: string) {
    try {
      const memberships = await ProgramMembershipModel.find({ user_id: userId }).lean();
      return memberships;
    } catch (error) {
      this.handleError('ProgramMembershipService.findByUser', error);
    }
  }

  async findByProgram(programId: string) {
    try {
      const memberships = await ProgramMembershipModel.find({ program_id: programId }).lean();
      return memberships;
    } catch (error) {
      this.handleError('ProgramMembershipService.findByProgram', error);
    }
  }

  async upsert(userId: string, programId: string, data: Partial<ProgramMembershipData>) {
    try {
      const membershipId = uuidv5(`${userId}-${programId}`, NAMESPACE);

      // Exclude fields that are handled by $setOnInsert to avoid conflicts
      const { joined_at, membership_id, user_id, program_id, ...dataToSet } = data;

      const updateOps: any = {
        $set: dataToSet,
        $setOnInsert: {
          membership_id: membershipId,
          user_id: userId,
          program_id: programId
        }
      };

      if (joined_at) {
        updateOps.$min = { joined_at };
      }

      const membership = await ProgramMembershipModel.findOneAndUpdate(
        { membership_id: membershipId },
        updateOps,
        { upsert: true, new: true }
      ).lean();

      return membership;
    } catch (error) {
      this.handleError('ProgramMembershipService.upsert', error);
    }
  }

  async update(id: string, updates: Partial<ProgramMembershipData>) {
    try {
      const membership = await ProgramMembershipModel.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      ).lean();

      if (!membership) {
        throw new Error('Program membership not found');
      }

      return {
        ...membership,
        id: (membership as any)._id.toString(),
        _id: (membership as any)._id.toString()
      };
    } catch (error) {
      this.handleError('ProgramMembershipService.update', error);
    }
  }

  async delete(id: string) {
    try {
      const membership = await ProgramMembershipModel.findByIdAndDelete(id).lean();
      if (!membership) {
        throw new Error('Program membership not found');
      }

      return {
        ...membership,
        id: (membership as any)._id.toString(),
        _id: (membership as any)._id.toString()
      };
    } catch (error) {
      this.handleError('ProgramMembershipService.delete', error);
    }
  }
}
