import { BaseService } from './BaseService';
import { TaskModel } from '../models/Task';
import { UserModel } from '../models/User';
import { BrandModel } from '../models/Brand';
import { ProgramModel } from '../models/Program';
import { ProgramMembershipModel } from '../models/ProgramMembership';

export class AnalyticsService extends BaseService {
  async getBrandAnalytics() {
    try {
      // Use denormalized brand_name field (no $lookup needed!)
      const taskMetrics = await TaskModel.aggregate([
        {
          $group: {
            _id: '$brand_id',
            brandName: { $first: '$brand_name' },
            totalTasks: { $sum: 1 },
            totalLikes: { $sum: '$likes' },
            totalComments: { $sum: '$comments' },
            totalShares: { $sum: '$shares' },
            totalReach: { $sum: '$reach' },
            avgEngagementRate: { $avg: '$engagement_rate' }
          }
        },
        {
          $project: {
            brandId: '$_id',
            brandName: { $ifNull: ['$brandName', 'Unknown'] },
            totalTasks: 1,
            totalLikes: 1,
            totalComments: 1,
            totalShares: 1,
            totalReach: 1,
            avgEngagementRate: { $ifNull: ['$avgEngagementRate', 0] },
            totalEngagement: { $add: ['$totalLikes', '$totalComments', '$totalShares'] }
          }
        }
      ]);

      const salesMetrics = await ProgramMembershipModel.aggregate([
        {
          $group: {
            _id: '$brand_id',
            totalSales: { $sum: '$sales_attributed' }
          }
        }
      ]);

      const salesMap = new Map();
      salesMetrics.forEach(item => {
        salesMap.set(item._id, item.totalSales || 0);
      });

      const brandAnalytics = taskMetrics.map(item => {
        const totalSales = salesMap.get(item.brandId) || 0;
        return {
          brandId: item.brandId,
          brandName: item.brandName,
          totalTasks: item.totalTasks,
          totalLikes: item.totalLikes,
          totalComments: item.totalComments,
          totalShares: item.totalShares,
          totalReach: item.totalReach,
          avgEngagementRate: item.avgEngagementRate,
          totalEngagement: item.totalEngagement,
          totalSales,
          conversionRate: item.totalEngagement > 0 ? (totalSales / item.totalEngagement) : 0,
          salesPerTask: item.totalTasks > 0 ? (totalSales / item.totalTasks) : 0
        };
      }).sort((a, b) => b.totalTasks - a.totalTasks);

      return brandAnalytics;
    } catch (error) {
      this.handleError('AnalyticsService.getBrandAnalytics', error);
    }
  }

  async getPlatformAnalytics() {
    try {
      const platformAnalytics = await TaskModel.aggregate([
        {
          $group: {
            _id: '$platform',
            totalTasks: { $sum: 1 },
            totalLikes: { $sum: '$likes' },
            totalComments: { $sum: '$comments' },
            totalShares: { $sum: '$shares' },
            totalReach: { $sum: '$reach' },
            avgEngagementRate: { $avg: '$engagement_rate' }
          }
        },
        {
          $project: {
            _id: 0,
            platform: '$_id',
            totalTasks: 1,
            totalLikes: 1,
            totalComments: 1,
            totalShares: 1,
            totalReach: 1,
            avgEngagementRate: 1,
            totalEngagement: { $add: ['$totalLikes', '$totalComments', '$totalShares'] }
          }
        },
        {
          $sort: { totalTasks: -1 }
        }
      ]);

      return platformAnalytics;
    } catch (error) {
      this.handleError('AnalyticsService.getPlatformAnalytics', error);
    }
  }

  async getUserAnalytics() {
    try {
      // Use $lookup to join with users collection (fixes N+1 query pattern)
      const userTaskMetrics = await TaskModel.aggregate([
        {
          $group: {
            _id: '$user_id',
            totalTasks: { $sum: 1 },
            totalLikes: { $sum: '$likes' },
            totalComments: { $sum: '$comments' },
            totalShares: { $sum: '$shares' },
            totalReach: { $sum: '$reach' },
            avgEngagementRate: { $avg: '$engagement_rate' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: 'user_id',
            as: 'user'
          }
        },
        {
          $project: {
            userId: '$_id',
            userName: { $ifNull: [{ $arrayElemAt: ['$user.name', 0] }, 'Unknown'] },
            userEmail: { $arrayElemAt: ['$user.email', 0] },
            totalTasks: 1,
            totalLikes: 1,
            totalComments: 1,
            totalShares: 1,
            totalReach: 1,
            avgEngagementRate: { $ifNull: ['$avgEngagementRate', 0] },
            totalEngagement: { $add: ['$totalLikes', '$totalComments', '$totalShares'] }
          }
        }
      ]);

      const userSalesMetrics = await ProgramMembershipModel.aggregate([
        {
          $group: {
            _id: '$user_id',
            totalSales: { $sum: '$sales_attributed' },
            totalPrograms: { $sum: 1 }
          }
        }
      ]);

      const salesMap = new Map();
      userSalesMetrics.forEach(item => {
        salesMap.set(item._id, {
          totalSales: item.totalSales || 0,
          totalPrograms: item.totalPrograms || 0
        });
      });

      const userAnalytics = userTaskMetrics.map(item => {
        const sales = salesMap.get(item.userId) || { totalSales: 0, totalPrograms: 0 };
        const influenceScore = item.totalReach > 0 ? item.totalEngagement / item.totalReach : 0;
        const conversionRate = item.totalEngagement > 0 ? (sales.totalSales / item.totalEngagement) : 0;

        return {
          userId: item.userId,
          userName: item.userName,
          userEmail: item.userEmail,
          totalTasks: item.totalTasks,
          totalLikes: item.totalLikes,
          totalComments: item.totalComments,
          totalShares: item.totalShares,
          totalReach: item.totalReach,
          totalEngagement: item.totalEngagement,
          avgEngagementRate: item.avgEngagementRate,
          influenceScore,
          totalSales: sales.totalSales,
          totalPrograms: sales.totalPrograms,
          conversionRate
        };
      })
        .sort((a, b) => b.totalEngagement - a.totalEngagement)
        .slice(0, 100);

      return userAnalytics;
    } catch (error) {
      this.handleError('AnalyticsService.getUserAnalytics', error);
    }
  }

  async getUserDetailAnalytics(userId: string) {
    try {
      const user = await UserModel.findOne({ user_id: userId });
      if (!user) {
        throw new Error('User not found');
      }

      const taskMetrics = await TaskModel.aggregate([
        { $match: { user_id: userId } },
        {
          $group: {
            _id: null,
            totalTasks: { $sum: 1 },
            totalLikes: { $sum: '$likes' },
            totalComments: { $sum: '$comments' },
            totalShares: { $sum: '$shares' },
            totalReach: { $sum: '$reach' },
            avgEngagementRate: { $avg: '$engagement_rate' }
          }
        }
      ]);

      const metrics = taskMetrics[0] || {
        totalTasks: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalReach: 0,
        avgEngagementRate: 0
      };

      const totalEngagement = metrics.totalLikes + metrics.totalComments + metrics.totalShares;

      const salesMetrics = await ProgramMembershipModel.aggregate([
        { $match: { user_id: userId } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$sales_attributed' },
            totalPrograms: { $sum: 1 }
          }
        }
      ]);

      const sales = salesMetrics[0] || { totalSales: 0, totalPrograms: 0 };

      const platformBreakdown = await TaskModel.aggregate([
        { $match: { user_id: userId } },
        {
          $group: {
            _id: '$platform',
            totalTasks: { $sum: 1 },
            totalLikes: { $sum: '$likes' },
            totalComments: { $sum: '$comments' },
            totalShares: { $sum: '$shares' },
            totalReach: { $sum: '$reach' },
            avgEngagementRate: { $avg: '$engagement_rate' }
          }
        },
        {
          $project: {
            _id: 0,
            platform: '$_id',
            totalTasks: 1,
            totalEngagement: { $add: ['$totalLikes', '$totalComments', '$totalShares'] },
            totalReach: 1,
            avgEngagementRate: 1
          }
        },
        { $sort: { totalEngagement: -1 } }
      ]);

      const programParticipation = await ProgramMembershipModel.aggregate([
        { $match: { user_id: userId } },
        {
          $lookup: {
            from: 'programs',
            localField: 'program_id',
            foreignField: 'program_id',
            as: 'program'
          }
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand_id',
            foreignField: 'brand_id',
            as: 'brand'
          }
        },
        {
          $project: {
            programId: '$program_id',
            programName: { $arrayElemAt: ['$program.name', 0] },
            brandName: { $arrayElemAt: ['$brand.name', 0] },
            tasksCompleted: '$tasks_completed',
            salesAttributed: '$sales_attributed'
          }
        }
      ]);

      const programTaskMetrics = await TaskModel.aggregate([
        { $match: { user_id: userId } },
        {
          $group: {
            _id: '$program_id',
            totalTasks: { $sum: 1 },
            totalEngagement: { $sum: { $add: ['$likes', '$comments', '$shares'] } },
            totalReach: { $sum: '$reach' }
          }
        }
      ]);

      const taskMetricsMap = new Map(
        programTaskMetrics.map(item => [item._id, item])
      );

      const programsWithMetrics = programParticipation.map(prog => ({
        ...prog,
        totalTasks: taskMetricsMap.get(prog.programId)?.totalTasks || 0,
        totalEngagement: taskMetricsMap.get(prog.programId)?.totalEngagement || 0,
        totalReach: taskMetricsMap.get(prog.programId)?.totalReach || 0
      }));

      const taskHistory = await TaskModel.find({ user_id: userId })
        .sort({ submitted_at: -1 })
        .limit(100)
        .lean();

      // Use denormalized brand_name field (no brand lookup needed!)
      const taskHistoryWithDetails = taskHistory.map((task) => ({
        taskId: task.task_id,
        platform: task.platform,
        submittedAt: task.submitted_at,
        likes: task.likes,
        comments: task.comments,
        shares: task.shares,
        reach: task.reach,
        engagement: task.likes + task.comments + task.shares,
        engagementRate: task.engagement_rate,
        brandName: task.brand_name || 'Unknown',
        programName: task.program_id || 'Unknown'
      }));

      const overallStats = {
        userId: user.user_id,
        userName: user.name,
        userEmail: user.email || null,
        totalTasks: metrics.totalTasks,
        totalLikes: metrics.totalLikes,
        totalComments: metrics.totalComments,
        totalShares: metrics.totalShares,
        totalReach: metrics.totalReach,
        totalEngagement,
        avgEngagementRate: metrics.avgEngagementRate || 0,
        influenceScore: metrics.totalReach > 0 ? totalEngagement / metrics.totalReach : 0,
        totalSales: sales.totalSales,
        totalPrograms: sales.totalPrograms,
        conversionRate: totalEngagement > 0 ? sales.totalSales / totalEngagement : 0
      };

      return {
        user: overallStats,
        performanceOverTime: [],
        platformBreakdown,
        programParticipation: programsWithMetrics,
        taskHistory: taskHistoryWithDetails
      };
    } catch (error) {
      this.handleError('AnalyticsService.getUserDetailAnalytics', error);
    }
  }

  async getProgramAnalytics() {
    try {
      const programTaskMetrics = await TaskModel.aggregate([
        {
          $group: {
            _id: '$program_id',
            brandId: { $first: '$brand_id' },
            brandName: { $first: '$brand_name' },
            totalTasks: { $sum: 1 },
            totalLikes: { $sum: '$likes' },
            totalComments: { $sum: '$comments' },
            totalShares: { $sum: '$shares' },
            totalReach: { $sum: '$reach' },
            avgEngagementRate: { $avg: '$engagement_rate' }
          }
        }
      ]);

      const programSalesMetrics = await ProgramMembershipModel.aggregate([
        {
          $group: {
            _id: '$program_id',
            totalSales: { $sum: '$sales_attributed' },
            totalAdvocates: { $sum: 1 }
          }
        }
      ]);

      const metricsMap = new Map();

      programTaskMetrics.forEach(item => {
        const totalEngagement = item.totalLikes + item.totalComments + item.totalShares;
        metricsMap.set(item._id, {
          programId: item._id,
          brandId: item.brandId,
          brandName: item.brandName || 'Unknown',
          totalTasks: item.totalTasks,
          totalLikes: item.totalLikes,
          totalComments: item.totalComments,
          totalShares: item.totalShares,
          totalReach: item.totalReach,
          totalEngagement,
          avgEngagementRate: item.avgEngagementRate || 0,
          totalSales: 0,
          totalAdvocates: 0,
          salesPerTask: 0,
          salesPerAdvocate: 0
        });
      });

      programSalesMetrics.forEach(item => {
        const existing = metricsMap.get(item._id);
        if (existing) {
          existing.totalSales = item.totalSales || 0;
          existing.totalAdvocates = item.totalAdvocates || 0;
          existing.salesPerTask = existing.totalTasks > 0
            ? existing.totalSales / existing.totalTasks
            : 0;
          existing.salesPerAdvocate = item.totalAdvocates > 0
            ? (item.totalSales / item.totalAdvocates)
            : 0;
        }
      });

      // Use denormalized brand_name field (no program/brand lookup needed!)
      const programAnalytics = Array.from(metricsMap.values())
        .sort((a, b) => b.totalEngagement - a.totalEngagement)
        .slice(0, 50);

      return programAnalytics;
    } catch (error) {
      this.handleError('AnalyticsService.getProgramAnalytics', error);
    }
  }

  async getBrandPlatformAnalytics() {
    try {
      // Use denormalized brand_name field (no $lookup needed!)
      const crossAnalytics = await TaskModel.aggregate([
        {
          $group: {
            _id: {
              brand_id: '$brand_id',
              platform: '$platform'
            },
            brandName: { $first: '$brand_name' },
            totalTasks: { $sum: 1 },
            totalLikes: { $sum: '$likes' },
            totalComments: { $sum: '$comments' },
            totalShares: { $sum: '$shares' },
            totalReach: { $sum: '$reach' },
            avgEngagementRate: { $avg: '$engagement_rate' }
          }
        },
        {
          $project: {
            brandId: '$_id.brand_id',
            brandName: { $ifNull: ['$brandName', 'Unknown'] },
            platform: '$_id.platform',
            totalTasks: 1,
            totalLikes: 1,
            totalComments: 1,
            totalShares: 1,
            totalReach: 1,
            avgEngagementRate: { $ifNull: ['$avgEngagementRate', 0] },
            totalEngagement: { $add: ['$totalLikes', '$totalComments', '$totalShares'] }
          }
        },
        {
          $sort: { totalTasks: -1 }
        }
      ]);

      return crossAnalytics;
    } catch (error) {
      this.handleError('AnalyticsService.getBrandPlatformAnalytics', error);
    }
  }

  async getDashboardData() {
    try {
      const [totalUsers, totalTasks, totalBrands, totalPrograms] = await Promise.all([
        UserModel.countDocuments(),
        TaskModel.countDocuments(),
        BrandModel.countDocuments(),
        ProgramModel.countDocuments()
      ]);

      const platformDistribution = await TaskModel.aggregate([
        {
          $group: {
            _id: '$platform',
            value: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            name: '$_id',
            value: 1
          }
        }
      ]);

      // Use denormalized brand_name field (no $lookup needed!)
      const topBrands = await TaskModel.aggregate([
        {
          $group: {
            _id: '$brand_id',
            brand: { $first: '$brand_name' },
            tasks: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            brand: { $ifNull: ['$brand', '$_id'] },
            tasks: 1
          }
        },
        {
          $sort: { tasks: -1 }
        },
        {
          $limit: 10
        }
      ]);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const engagementTrend = await TaskModel.aggregate([
        {
          $match: {
            submitted_at: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$submitted_at' }
            },
            totalEngagement: {
              $sum: { $add: ['$likes', '$comments', '$shares'] }
            }
          }
        },
        {
          $project: {
            _id: 0,
            date: '$_id',
            engagement: '$totalEngagement'
          }
        },
        {
          $sort: { date: 1 }
        }
      ]);

      return {
        totalUsers,
        totalTasks,
        totalBrands,
        totalPrograms,
        platformDistribution,
        topBrands,
        engagementTrend
      };
    } catch (error) {
      this.handleError('AnalyticsService.getDashboardData', error);
    }
  }
}
