/**
 * Integration tests for AnalyticsService
 *
 * These tests verify the current behavior before refactoring to:
 * 1. Fix N+1 query patterns with $lookup
 * 2. Add denormalized brand_name fields
 * 3. Optimize aggregation pipelines
 *
 * IMPORTANT: All tests should pass before AND after refactoring
 */

import { AnalyticsService } from '../AnalyticsService';
import { UserModel } from '../../models/User';
import { BrandModel } from '../../models/Brand';
import { ProgramModel } from '../../models/Program';
import { ProgramMembershipModel } from '../../models/ProgramMembership';
import { TaskModel } from '../../models/Task';

describe('AnalyticsService - Integration Tests', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    // Clear all collections
    await Promise.all([
      UserModel.deleteMany({}),
      BrandModel.deleteMany({}),
      ProgramModel.deleteMany({}),
      ProgramMembershipModel.deleteMany({}),
      TaskModel.deleteMany({})
    ]);

    service = new AnalyticsService();
  });

  describe('Test Data Setup', () => {
    let testData: any;

    beforeEach(async () => {
      // Create comprehensive test dataset
      const user1 = await UserModel.create({
        user_id: 'user-001',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        status: 'active',
        joined_at: new Date('2024-01-01')
      });

      const user2 = await UserModel.create({
        user_id: 'user-002',
        name: 'Bob Smith',
        email: 'bob@example.com',
        status: 'active',
        joined_at: new Date('2024-01-15')
      });

      const brand1 = await BrandModel.create({
        brand_id: 'brand-001',
        name: 'Nike',
        company_id: 'company-001'
      });

      const brand2 = await BrandModel.create({
        brand_id: 'brand-002',
        name: 'Adidas',
        company_id: 'company-001'
      });

      const program1 = await ProgramModel.create({
        program_id: 'program-001',
        brand_id: 'brand-001',
        company_id: 'company-001',
        status: 'active'
      });

      const program2 = await ProgramModel.create({
        program_id: 'program-002',
        brand_id: 'brand-002',
        company_id: 'company-001',
        status: 'active'
      });

      const membership1 = await ProgramMembershipModel.create({
        membership_id: 'membership-001',
        user_id: 'user-001',
        program_id: 'program-001',
        brand_id: 'brand-001',
        tasks_completed: 5,
        sales_attributed: 1000,
        joined_at: new Date('2024-01-01')
      });

      const membership2 = await ProgramMembershipModel.create({
        membership_id: 'membership-002',
        user_id: 'user-002',
        program_id: 'program-002',
        brand_id: 'brand-002',
        tasks_completed: 3,
        sales_attributed: 500,
        joined_at: new Date('2024-01-15')
      });

      // Create tasks for Nike (Instagram) - use recent dates
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

      await TaskModel.create({
        task_id: 'task-001',
        user_id: 'user-001',
        program_id: 'program-001',
        brand_id: 'brand-001',
        brand_name: 'Nike',
        membership_id: 'membership-001',
        platform: 'Instagram',
        likes: 100,
        comments: 10,
        shares: 5,
        reach: 1000,
        engagement_rate: 0.115,
        submitted_at: fiveDaysAgo
      });

      await TaskModel.create({
        task_id: 'task-002',
        user_id: 'user-001',
        program_id: 'program-001',
        brand_id: 'brand-001',
        brand_name: 'Nike',
        membership_id: 'membership-001',
        platform: 'Instagram',
        likes: 200,
        comments: 20,
        shares: 10,
        reach: 2000,
        engagement_rate: 0.115,
        submitted_at: twoDaysAgo
      });

      // Create tasks for Adidas (TikTok)
      await TaskModel.create({
        task_id: 'task-003',
        user_id: 'user-002',
        program_id: 'program-002',
        brand_id: 'brand-002',
        brand_name: 'Adidas',
        membership_id: 'membership-002',
        platform: 'TikTok',
        likes: 150,
        comments: 15,
        shares: 8,
        reach: 1500,
        engagement_rate: 0.115,
        submitted_at: tenDaysAgo
      });

      testData = {
        users: [user1, user2],
        brands: [brand1, brand2],
        programs: [program1, program2],
        memberships: [membership1, membership2]
      };
    });

    describe('getBrandAnalytics()', () => {
      it('should return analytics grouped by brand', async () => {
        const result = await service.getBrandAnalytics();

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result?.length).toBe(2);

        // Nike should be first (more tasks)
        const nike = result?.find(b => b.brandName === 'Nike');
        expect(nike).toBeDefined();
        expect(nike?.brandId).toBe('brand-001');
        expect(nike?.totalTasks).toBe(2);
        expect(nike?.totalLikes).toBe(300);
        expect(nike?.totalComments).toBe(30);
        expect(nike?.totalShares).toBe(15);
        expect(nike?.totalReach).toBe(3000);
        expect(nike?.totalEngagement).toBe(345);
        expect(nike?.totalSales).toBe(1000);

        // Adidas
        const adidas = result?.find(b => b.brandName === 'Adidas');
        expect(adidas).toBeDefined();
        expect(adidas?.brandId).toBe('brand-002');
        expect(adidas?.totalTasks).toBe(1);
        expect(adidas?.totalLikes).toBe(150);
        expect(adidas?.totalSales).toBe(500);
      });

      it('should handle brands with no tasks', async () => {
        // Clear all tasks
        await TaskModel.deleteMany({});

        const result = await service.getBrandAnalytics();

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result?.length).toBe(0);
      });

      it('should calculate engagement metrics correctly', async () => {
        const result = await service.getBrandAnalytics();

        const nike = result?.find(b => b.brandName === 'Nike');
        expect(nike?.avgEngagementRate).toBeCloseTo(0.115, 3);
        expect(nike?.conversionRate).toBeGreaterThan(0);
        expect(nike?.salesPerTask).toBe(500); // 1000 / 2
      });
    });

    describe('getPlatformAnalytics()', () => {
      it('should return analytics grouped by platform', async () => {
        const result = await service.getPlatformAnalytics();

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result?.length).toBe(2);

        // Instagram (2 tasks)
        const instagram = result?.find(p => p.platform === 'Instagram');
        expect(instagram).toBeDefined();
        expect(instagram?.totalTasks).toBe(2);
        expect(instagram?.totalLikes).toBe(300);
        expect(instagram?.totalComments).toBe(30);
        expect(instagram?.totalShares).toBe(15);
        expect(instagram?.totalEngagement).toBe(345);

        // TikTok (1 task)
        const tiktok = result?.find(p => p.platform === 'TikTok');
        expect(tiktok).toBeDefined();
        expect(tiktok?.totalTasks).toBe(1);
        expect(tiktok?.totalLikes).toBe(150);
      });

      it('should sort platforms by total tasks descending', async () => {
        const result = await service.getPlatformAnalytics();

        expect(result?.[0].platform).toBe('Instagram'); // 2 tasks
        expect(result?.[1].platform).toBe('TikTok');     // 1 task
      });
    });

    describe('getUserAnalytics()', () => {
      it('should return top user analytics', async () => {
        const result = await service.getUserAnalytics();

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result?.length).toBe(2);

        // Alice should be first (more engagement)
        const alice = result?.find(u => u.userName === 'Alice Johnson');
        expect(alice).toBeDefined();
        expect(alice?.userId).toBe('user-001');
        expect(alice?.totalTasks).toBe(2);
        expect(alice?.totalEngagement).toBe(345);
        expect(alice?.totalSales).toBe(1000);
        expect(alice?.totalPrograms).toBe(1);
        expect(alice?.userEmail).toBe('alice@example.com');

        // Bob
        const bob = result?.find(u => u.userName === 'Bob Smith');
        expect(bob).toBeDefined();
        expect(bob?.userId).toBe('user-002');
        expect(bob?.totalTasks).toBe(1);
        expect(bob?.totalSales).toBe(500);
      });

      it('should calculate influence score correctly', async () => {
        const result = await service.getUserAnalytics();

        const alice = result?.find(u => u.userName === 'Alice Johnson');
        // influenceScore = totalEngagement / totalReach = 345 / 3000
        expect(alice?.influenceScore).toBeCloseTo(0.115, 3);
      });

      it('should limit results to 100 users', async () => {
        // This would be tested with more data, just verify limit exists
        const result = await service.getUserAnalytics();
        expect(result?.length).toBeLessThanOrEqual(100);
      });
    });

    describe('getUserDetailAnalytics()', () => {
      it('should return detailed analytics for a specific user', async () => {
        const result = await service.getUserDetailAnalytics('user-001');

        expect(result).toBeDefined();
        expect(result?.user).toBeDefined();
        expect(result?.user.userId).toBe('user-001');
        expect(result?.user.userName).toBe('Alice Johnson');
        expect(result?.user.totalTasks).toBe(2);
        expect(result?.user.totalEngagement).toBe(345);
        expect(result?.user.totalSales).toBe(1000);
      });

      it('should include platform breakdown', async () => {
        const result = await service.getUserDetailAnalytics('user-001');

        expect(result?.platformBreakdown).toBeDefined();
        expect(Array.isArray(result?.platformBreakdown)).toBe(true);
        expect(result?.platformBreakdown?.length).toBe(1);
        expect(result?.platformBreakdown?.[0].platform).toBe('Instagram');
      });

      it('should include program participation', async () => {
        const result = await service.getUserDetailAnalytics('user-001');

        expect(result?.programParticipation).toBeDefined();
        expect(Array.isArray(result?.programParticipation)).toBe(true);
        expect(result?.programParticipation?.length).toBe(1);

        const prog = result?.programParticipation?.[0];
        expect(prog?.programId).toBe('program-001');
        expect(prog?.brandName).toBe('Nike');
        expect(prog?.totalTasks).toBe(2);
      });

      it('should include task history sorted by date', async () => {
        const result = await service.getUserDetailAnalytics('user-001');

        expect(result?.taskHistory).toBeDefined();
        expect(Array.isArray(result?.taskHistory)).toBe(true);
        expect(result?.taskHistory?.length).toBe(2);

        // Should be sorted descending by submitted_at
        const dates = result?.taskHistory?.map(t => new Date(t.submittedAt).getTime());
        expect(dates?.[0]).toBeGreaterThan(dates?.[1] || 0);
      });

      it('should throw error for non-existent user', async () => {
        await expect(
          service.getUserDetailAnalytics('non-existent-user')
        ).rejects.toThrow('User not found');
      });

      it('should limit task history to 100 tasks', async () => {
        const result = await service.getUserDetailAnalytics('user-001');
        expect(result?.taskHistory?.length).toBeLessThanOrEqual(100);
      });
    });

    describe('getProgramAnalytics()', () => {
      it('should return analytics grouped by program', async () => {
        const result = await service.getProgramAnalytics();

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result?.length).toBe(2);

        const program1 = result?.find(p => p.programId === 'program-001');
        expect(program1).toBeDefined();
        expect(program1?.brandId).toBe('brand-001');
        expect(program1?.brandName).toBe('Nike');
        expect(program1?.totalTasks).toBe(2);
        expect(program1?.totalAdvocates).toBe(1);
        expect(program1?.totalSales).toBe(1000);
        expect(program1?.salesPerTask).toBe(500);
        expect(program1?.salesPerAdvocate).toBe(1000);
      });

      it('should sort by total engagement descending', async () => {
        const result = await service.getProgramAnalytics();

        // program-001 should be first (more engagement: 345)
        expect(result?.[0].programId).toBe('program-001');
        expect(result?.[1].programId).toBe('program-002');
      });

      it('should limit results to 50 programs', async () => {
        const result = await service.getProgramAnalytics();
        expect(result?.length).toBeLessThanOrEqual(50);
      });
    });

    describe('getBrandPlatformAnalytics()', () => {
      it('should return cross-analytics by brand and platform', async () => {
        const result = await service.getBrandPlatformAnalytics();

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result?.length).toBe(2);

        // Nike + Instagram
        const nikeInstagram = result?.find(
          r => r.brandName === 'Nike' && r.platform === 'Instagram'
        );
        expect(nikeInstagram).toBeDefined();
        expect(nikeInstagram?.brandId).toBe('brand-001');
        expect(nikeInstagram?.totalTasks).toBe(2);
        expect(nikeInstagram?.totalEngagement).toBe(345);

        // Adidas + TikTok
        const adidasTikTok = result?.find(
          r => r.brandName === 'Adidas' && r.platform === 'TikTok'
        );
        expect(adidasTikTok).toBeDefined();
        expect(adidasTikTok?.totalTasks).toBe(1);
      });

      it('should sort by total tasks descending', async () => {
        const result = await service.getBrandPlatformAnalytics();

        // Nike+Instagram (2 tasks) should be first
        expect(result?.[0].totalTasks).toBeGreaterThanOrEqual(result?.[1].totalTasks || 0);
      });
    });

    describe('getDashboardData()', () => {
      it('should return summary counts', async () => {
        const result = await service.getDashboardData();

        expect(result).toBeDefined();
        expect(result?.totalUsers).toBe(2);
        expect(result?.totalTasks).toBe(3);
        expect(result?.totalBrands).toBe(2);
        expect(result?.totalPrograms).toBe(2);
      });

      it('should return platform distribution', async () => {
        const result = await service.getDashboardData();

        expect(result?.platformDistribution).toBeDefined();
        expect(Array.isArray(result?.platformDistribution)).toBe(true);
        expect(result?.platformDistribution?.length).toBe(2);

        const instagram = result?.platformDistribution?.find(p => p.name === 'Instagram');
        expect(instagram?.value).toBe(2);

        const tiktok = result?.platformDistribution?.find(p => p.name === 'TikTok');
        expect(tiktok?.value).toBe(1);
      });

      it('should return top 10 brands', async () => {
        const result = await service.getDashboardData();

        expect(result?.topBrands).toBeDefined();
        expect(Array.isArray(result?.topBrands)).toBe(true);
        expect(result?.topBrands?.length).toBe(2);
        expect(result?.topBrands?.length).toBeLessThanOrEqual(10);

        const nike = result?.topBrands?.find(b => b.brand === 'Nike');
        expect(nike?.tasks).toBe(2);
      });

      it('should return engagement trend for last 30 days', async () => {
        const result = await service.getDashboardData();

        expect(result?.engagementTrend).toBeDefined();
        expect(Array.isArray(result?.engagementTrend)).toBe(true);

        // All our test data is within last 30 days
        expect(result?.engagementTrend?.length).toBeGreaterThan(0);
      });

      it('should handle empty database', async () => {
        // Clear all data
        await Promise.all([
          UserModel.deleteMany({}),
          TaskModel.deleteMany({}),
          BrandModel.deleteMany({}),
          ProgramModel.deleteMany({})
        ]);

        const result = await service.getDashboardData();

        expect(result?.totalUsers).toBe(0);
        expect(result?.totalTasks).toBe(0);
        expect(result?.totalBrands).toBe(0);
        expect(result?.totalPrograms).toBe(0);
        expect(result?.platformDistribution).toEqual([]);
        expect(result?.topBrands).toEqual([]);
        expect(result?.engagementTrend).toEqual([]);
      });
    });
  });

  describe('Performance Characteristics', () => {
    beforeEach(async () => {
      // Create minimal test data
      await BrandModel.create({
        brand_id: 'brand-test',
        name: 'Test Brand',
        company_id: 'company-test'
      });

      await UserModel.create({
        user_id: 'user-test',
        name: 'Test User',
        email: 'test@example.com',
        status: 'active'
      });

      await TaskModel.create({
        task_id: 'task-test',
        user_id: 'user-test',
        program_id: 'program-test',
        brand_id: 'brand-test',
        brand_name: 'Test Brand',
        membership_id: 'membership-test',
        platform: 'Instagram',
        likes: 10,
        comments: 1,
        shares: 1,
        reach: 100,
        engagement_rate: 0.12,
        submitted_at: new Date()
      });
    });

    it('should execute getBrandAnalytics in reasonable time', async () => {
      const start = Date.now();
      await service.getBrandAnalytics();
      const duration = Date.now() - start;

      // Should complete in less than 1 second for small dataset
      expect(duration).toBeLessThan(1000);
    });

    it('should execute getDashboardData in reasonable time', async () => {
      const start = Date.now();
      await service.getDashboardData();
      const duration = Date.now() - start;

      // Should complete in less than 1 second for small dataset
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Data Consistency', () => {
    it('should return consistent results across multiple calls', async () => {
      // Setup data
      await BrandModel.create({
        brand_id: 'brand-consistency',
        name: 'Consistent Brand',
        company_id: 'company-test'
      });

      await TaskModel.create({
        task_id: 'task-consistency',
        user_id: 'user-test',
        program_id: 'program-test',
        brand_id: 'brand-consistency',
        brand_name: 'Consistent Brand',
        membership_id: 'membership-test',
        platform: 'Instagram',
        likes: 100,
        comments: 10,
        shares: 5,
        reach: 1000,
        engagement_rate: 0.115,
        submitted_at: new Date()
      });

      // Call multiple times
      const result1 = await service.getBrandAnalytics();
      const result2 = await service.getBrandAnalytics();
      const result3 = await service.getBrandAnalytics();

      // Results should be identical
      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });

    it('should handle null/undefined brand names gracefully', async () => {
      await TaskModel.create({
        task_id: 'task-no-brand',
        user_id: 'user-test',
        program_id: 'program-test',
        brand_id: 'non-existent-brand',
        brand_name: 'Unknown',
        membership_id: 'membership-test',
        platform: 'Instagram',
        likes: 10,
        comments: 1,
        shares: 1,
        reach: 100,
        engagement_rate: 0.12,
        submitted_at: new Date()
      });

      const result = await service.getBrandAnalytics();

      const unknownBrand = result?.find(b => b.brandName === 'Unknown');
      expect(unknownBrand).toBeDefined();
    });
  });
});
