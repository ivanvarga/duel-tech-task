import { ProcessFileWorker } from '../ProcessFileWorker';
import { ProgramMembershipModel } from '../../../api/models';
import { getStorageAdapter } from '../../../utils/storage';
import { parseJSON } from '../../../utils/json-repair';
import { WorkerServices } from '../../BaseWorker';
import {
  UserService,
  BrandService,
  ProgramService,
  ProgramMembershipService,
  TaskService,
  FailedImportService
} from '../../../api/services';

jest.mock('../../../utils/storage');
jest.mock('../../../utils/json-repair');

describe('ProcessFileWorker - joined_at behavior', () => {
  let worker: ProcessFileWorker;
  let mockServices: WorkerServices;

  beforeEach(() => {
    worker = new ProcessFileWorker();
    mockServices = {
      user: new UserService(),
      brand: new BrandService(),
      program: new ProgramService(),
      programMembership: new ProgramMembershipService(),
      task: new TaskService(),
      failedImport: new FailedImportService()
    };
    jest.clearAllMocks();
  });

  describe('$min operator for joined_at', () => {
    it('should keep the earliest joined_at when processing multiple files for the same membership', async () => {
      // Mock storage adapter
      const mockStorage = {
        readFile: jest.fn(),
        deleteFile: jest.fn(),
        moveToFailed: jest.fn(),
      };
      (getStorageAdapter as jest.Mock).mockReturnValue(mockStorage);

      // Create test data with different joined_at dates
      const laterDate = new Date('2024-06-01');
      const earlierDate = new Date('2024-01-01');

      const fileWithLaterDate = {
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test User',
        email: 'test@example.com',
        instagram_handle: '@testuser',
        tiktok_handle: '@testuser_tiktok',
        joined_at: laterDate.toISOString(),
        advocacy_programs: [
          {
            program_id: '660e8400-e29b-41d4-a716-446655440000',
            brand: 'Nike',
            tasks_completed: [],
            total_sales_attributed: 1000,
          },
        ],
      };

      const fileWithEarlierDate = {
        ...fileWithLaterDate,
        joined_at: earlierDate.toISOString(),
      };

      // Mock storage and parseJSON
      mockStorage.readFile
        .mockResolvedValueOnce(JSON.stringify(fileWithLaterDate))
        .mockResolvedValueOnce(JSON.stringify(fileWithEarlierDate));

      (parseJSON as jest.Mock)
        .mockReturnValueOnce({
          success: true,
          data: fileWithLaterDate,
          repaired: false,
        })
        .mockReturnValueOnce({
          success: true,
          data: fileWithEarlierDate,
          repaired: false,
        });

      mockStorage.deleteFile.mockResolvedValue(undefined);

      // Process first file (later date)
      await worker.execute(
        { fileName: 'file1.json' },
        { jobId: 'job1', workerId: 'worker1', timestamp: new Date(), services: mockServices }
      );

      // Get the membership after first file
      const membershipAfterFirst = await ProgramMembershipModel.findOne({
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        program_id: '660e8400-e29b-41d4-a716-446655440000',
      });

      expect(membershipAfterFirst).toBeDefined();
      expect(membershipAfterFirst?.joined_at).toEqual(laterDate);

      // Process second file (earlier date)

      await worker.execute(
        { fileName: 'file2.json' },
        { jobId: 'job2', workerId: 'worker1', timestamp: new Date(), services: mockServices }
      );

      // Get the membership after second file
      const membershipAfterSecond = await ProgramMembershipModel.findOne({
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        program_id: '660e8400-e29b-41d4-a716-446655440000',
      });

      // Should have the earlier date now
      expect(membershipAfterSecond).toBeDefined();
      expect(membershipAfterSecond?.joined_at).toEqual(earlierDate);
    });

    it('should not update joined_at when processing a file with a later date', async () => {
      const mockStorage = {
        readFile: jest.fn(),
        deleteFile: jest.fn(),
        moveToFailed: jest.fn(),
      };
      (getStorageAdapter as jest.Mock).mockReturnValue(mockStorage);

      const earlierDate = new Date('2024-01-01');
      const laterDate = new Date('2024-06-01');

      const fileWithEarlierDate = {
        user_id: '770e8400-e29b-41d4-a716-446655440000',
        name: 'Test User 2',
        email: 'test2@example.com',
        instagram_handle: '@testuser2',
        tiktok_handle: '@testuser2_tiktok',
        joined_at: earlierDate.toISOString(),
        advocacy_programs: [
          {
            program_id: '880e8400-e29b-41d4-a716-446655440000',
            brand: 'Adidas',
            tasks_completed: [],
            total_sales_attributed: 2000,
          },
        ],
      };

      const fileWithLaterDate = {
        ...fileWithEarlierDate,
        joined_at: laterDate.toISOString(),
      };

      // Mock storage and parseJSON
      mockStorage.readFile
        .mockResolvedValueOnce(JSON.stringify(fileWithEarlierDate))
        .mockResolvedValueOnce(JSON.stringify(fileWithLaterDate));

      (parseJSON as jest.Mock)
        .mockReturnValueOnce({
          success: true,
          data: fileWithEarlierDate,
          repaired: false,
        })
        .mockReturnValueOnce({
          success: true,
          data: fileWithLaterDate,
          repaired: false,
        });

      mockStorage.deleteFile.mockResolvedValue(undefined);

      // Process first file (earlier date)
      await worker.execute(
        { fileName: 'file1.json' },
        { jobId: 'job1', workerId: 'worker1', timestamp: new Date(), services: mockServices }
      );

      const membershipAfterFirst = await ProgramMembershipModel.findOne({
        user_id: '770e8400-e29b-41d4-a716-446655440000',
        program_id: '880e8400-e29b-41d4-a716-446655440000',
      });

      expect(membershipAfterFirst?.joined_at).toEqual(earlierDate);

      // Process second file (later date)

      await worker.execute(
        { fileName: 'file2.json' },
        { jobId: 'job2', workerId: 'worker1', timestamp: new Date(), services: mockServices }
      );

      const membershipAfterSecond = await ProgramMembershipModel.findOne({
        user_id: '770e8400-e29b-41d4-a716-446655440000',
        program_id: '880e8400-e29b-41d4-a716-446655440000',
      });

      // Should still have the earlier date
      expect(membershipAfterSecond?.joined_at).toEqual(earlierDate);
    });

    it('should work correctly regardless of file processing order', async () => {
      const mockStorage = {
        readFile: jest.fn(),
        deleteFile: jest.fn(),
        moveToFailed: jest.fn(),
      };
      (getStorageAdapter as jest.Mock).mockReturnValue(mockStorage);

      const dates = [
        new Date('2024-06-01'),
        new Date('2024-01-01'),
        new Date('2024-03-15'),
        new Date('2024-12-01'),
      ];

      const files = dates.map((date) => ({
        user_id: '990e8400-e29b-41d4-a716-446655440000',
        name: 'Test User 3',
        email: 'test3@example.com',
        instagram_handle: '@testuser3',
        tiktok_handle: '@testuser3_tiktok',
        joined_at: date.toISOString(),
        advocacy_programs: [
          {
            program_id: 'aa0e8400-e29b-41d4-a716-446655440000',
            brand: 'Puma',
            tasks_completed: [],
            total_sales_attributed: 3000,
          },
        ],
      }));

      // Mock storage deleteFile
      mockStorage.deleteFile.mockResolvedValue(undefined);

      // Process files in random order
      for (let i = 0; i < files.length; i++) {
        mockStorage.readFile.mockResolvedValueOnce(JSON.stringify(files[i]));

        (parseJSON as jest.Mock).mockReturnValueOnce({
          success: true,
          data: files[i],
          repaired: false,
        });

        await worker.execute(
          { fileName: `file${i}.json` },
          { jobId: `job${i}`, workerId: 'worker1', timestamp: new Date(), services: mockServices }
        );
      }

      // Get final membership
      const finalMembership = await ProgramMembershipModel.findOne({
        user_id: '990e8400-e29b-41d4-a716-446655440000',
        program_id: 'aa0e8400-e29b-41d4-a716-446655440000',
      });

      // Should have the earliest date (2024-01-01)
      const expectedEarliestDate = new Date('2024-01-01');
      expect(finalMembership?.joined_at).toEqual(expectedEarliestDate);
    });
  });
});
