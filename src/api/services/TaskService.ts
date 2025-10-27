import { FilterQuery } from 'mongoose';
import { BaseService, PaginationOptions, SortOptions } from './BaseService';
import { TaskModel } from '../models/Task';
import { UserModel } from '../models/User';
import { BrandModel } from '../models/Brand';

export interface TaskData {
  task_id: string;
  user_id: string;
  program_id: string;
  membership_id: string;
  brand_id: string;
  brand_name: string;
  platform: string;
  post_url?: string;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  engagement_rate: number;
  submitted_at: Date;
}

export class TaskService extends BaseService {
  async findAll(
    filter: FilterQuery<any>,
    pagination: PaginationOptions,
    sort: SortOptions
  ) {
    try {
      const mongoFilter: FilterQuery<any> = {};

      if (filter.q) {
        mongoFilter.$or = [
          { task_id: { $regex: filter.q, $options: 'i' } },
          { user_id: { $regex: filter.q, $options: 'i' } },
          { platform: { $regex: filter.q, $options: 'i' } }
        ];
      }

      if (filter.user_id) {
        mongoFilter.user_id = filter.user_id;
      }

      if (filter.program_id) {
        mongoFilter.program_id = filter.program_id;
      }

      if (filter.platform) {
        mongoFilter.platform = filter.platform;
      }

      const mongoSort = this.buildMongoSort(sort);
      const result = await this.findWithPagination(TaskModel, mongoFilter, pagination, mongoSort);

      const tasks = await Promise.all(
        result.data.map(async (task) => {
          const [user, brand] = await Promise.all([
            UserModel.findOne({ user_id: task.user_id }).lean(),
            BrandModel.findOne({ brand_id: task.brand_id }).lean()
          ]);

          return {
            ...task,
            id: (task as any)._id.toString(),
            _id: (task as any)._id.toString(),
            user_name: user?.name || null,
            brand_name: brand?.name || null
          };
        })
      );

      return {
        data: tasks,
        total: result.total
      };
    } catch (error) {
      this.handleError('TaskService.findAll', error);
    }
  }

  async findById(id: string) {
    try {
      const task = await TaskModel.findById(id).lean();
      if (!task) {
        throw new Error('Task not found');
      }

      const [user, brand] = await Promise.all([
        UserModel.findOne({ user_id: task.user_id }).lean(),
        BrandModel.findOne({ brand_id: task.brand_id }).lean()
      ]);

      return {
        ...task,
        id: (task as any)._id.toString(),
        _id: (task as any)._id.toString(),
        user_name: user?.name || null,
        brand_name: brand?.name || null
      };
    } catch (error) {
      this.handleError('TaskService.findById', error);
    }
  }

  async findByUser(userId: string) {
    try {
      const tasks = await TaskModel.find({ user_id: userId })
        .sort({ submitted_at: -1 })
        .limit(100)
        .lean();
      return tasks;
    } catch (error) {
      this.handleError('TaskService.findByUser', error);
    }
  }

  async findByProgram(programId: string) {
    try {
      const tasks = await TaskModel.find({ program_id: programId }).lean();
      return tasks;
    } catch (error) {
      this.handleError('TaskService.findByProgram', error);
    }
  }

  async upsert(taskId: string, taskData: Partial<TaskData>) {
    try {
      // Exclude task_id from $set to avoid conflict with $setOnInsert
      const { task_id: _task_id, ...dataToSet } = taskData;

      const task = await TaskModel.findOneAndUpdate(
        { task_id: taskId },
        {
          $set: dataToSet,
          $setOnInsert: { task_id: taskId }
        },
        { upsert: true, new: true }
      ).lean();

      return task;
    } catch (error) {
      this.handleError('TaskService.upsert', error);
    }
  }

  async update(id: string, updates: Partial<TaskData>) {
    try {
      const task = await TaskModel.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      ).lean();

      if (!task) {
        throw new Error('Task not found');
      }

      return {
        ...task,
        id: (task as any)._id.toString(),
        _id: (task as any)._id.toString()
      };
    } catch (error) {
      this.handleError('TaskService.update', error);
    }
  }

  async delete(id: string) {
    try {
      const task = await TaskModel.findByIdAndDelete(id).lean();
      if (!task) {
        throw new Error('Task not found');
      }

      return {
        ...task,
        id: (task as any)._id.toString(),
        _id: (task as any)._id.toString()
      };
    } catch (error) {
      this.handleError('TaskService.delete', error);
    }
  }
}
