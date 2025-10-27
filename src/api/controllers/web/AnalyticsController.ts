import { Request, ResponseToolkit } from '@hapi/hapi';
import { AppContext } from '../../AppContext';

export class AnalyticsController {
  constructor(private context: AppContext) {}

  async getStatus() {
    return {
      status: 'ok',
      message: 'Web API is running',
      timestamp: new Date().toISOString()
    };
  }

  async getStats(_request: Request, h: ResponseToolkit) {
    try {
      const dashboardData = await this.context.services.analytics.getDashboardData();
      return h.response(dashboardData).code(200);
    } catch (error) {
      return h.response({
        error: 'Failed to fetch analytics stats'
      }).code(500);
    }
  }

  async getBrands(_request: Request, h: ResponseToolkit) {
    try {
      const brandsWithDetails = await this.context.services.analytics.getBrandAnalytics();
      return h.response(brandsWithDetails).code(200);
    } catch (error) {
      return h.response({
        error: 'Failed to fetch brand analytics'
      }).code(500);
    }
  }

  async getPlatforms(_request: Request, h: ResponseToolkit) {
    try {
      const platformAnalytics = await this.context.services.analytics.getPlatformAnalytics();
      return h.response(platformAnalytics).code(200);
    } catch (error) {
      return h.response({
        error: 'Failed to fetch platform analytics'
      }).code(500);
    }
  }

  async getUsers(_request: Request, h: ResponseToolkit) {
    try {
      const usersWithDetails = await this.context.services.analytics.getUserAnalytics();
      return h.response(usersWithDetails).code(200);
    } catch (error) {
      return h.response({
        error: 'Failed to fetch user analytics'
      }).code(500);
    }
  }

  async getUserDetail(request: Request, h: ResponseToolkit) {
    try {
      const userId = request.params.userId;
      const result = await this.context.services.analytics.getUserDetailAnalytics(userId);
      return h.response(result).code(200);
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        return h.response({ error: 'User not found' }).code(404);
      }
      return h.response({
        error: 'Failed to fetch user detail analytics'
      }).code(500);
    }
  }

  async getPrograms(_request: Request, h: ResponseToolkit) {
    try {
      const programsWithDetails = await this.context.services.analytics.getProgramAnalytics();
      return h.response(programsWithDetails).code(200);
    } catch (error) {
      return h.response({
        error: 'Failed to fetch program analytics'
      }).code(500);
    }
  }

  async getBrandsPlatforms(_request: Request, h: ResponseToolkit) {
    try {
      const analyticsWithBrandNames = await this.context.services.analytics.getBrandPlatformAnalytics();
      return h.response(analyticsWithBrandNames).code(200);
    } catch (error) {
      return h.response({
        error: 'Failed to fetch brand-platform analytics'
      }).code(500);
    }
  }
}
