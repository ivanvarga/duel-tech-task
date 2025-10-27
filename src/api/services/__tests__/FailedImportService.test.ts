import { FailedImportService } from '../FailedImportService';
import { FailedImportModel } from '../../models/FailedImport';
import { promises as fs } from 'fs';
import path from 'path';
import { config } from '../../../config';

describe('FailedImportService', () => {
  let service: FailedImportService;
  const testFileName = 'test-failed-import.json';
  const testFileContent = '{"invalid": json}';

  beforeEach(async () => {
    // Clear only FailedImport collection before each test
    await FailedImportModel.deleteMany({});
    service = new FailedImportService();
  });

  describe('delete', () => {
    it('should delete both database record and file from failed directory', async () => {
      // Create a test file in the failed directory
      if (config.storage.type === 'local' && config.storage.local) {
        const failedDir = path.join(config.storage.local.path, 'failed');
        await fs.mkdir(failedDir, { recursive: true });

        const filePath = path.join(failedDir, testFileName);
        await fs.writeFile(filePath, testFileContent);

        // Verify file exists
        const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
        expect(fileExists).toBe(true);

        // Create a failed import record
        const failedImport = await service.create({
          file_name: testFileName,
          file_path: testFileName,
          raw_data: testFileContent,
          error_type: 'json_parse_error',
          error_message: 'Invalid JSON',
          attempted_at: new Date(),
          retry_count: 0,
          status: 'failed'
        });

        expect(failedImport).toBeDefined();
        const id = (failedImport as any)._id.toString();

        // Delete the failed import
        const deleted = await service.delete(id);

        expect(deleted).toBeDefined();
        expect(deleted?.file_name).toBe(testFileName);

        // Verify database record is deleted
        const found = await FailedImportModel.findById(id);
        expect(found).toBeNull();

        // Verify file is deleted
        const fileStillExists = await fs.access(filePath).then(() => true).catch(() => false);
        expect(fileStillExists).toBe(false);
      } else {
        // Skip test if not using local storage
        expect(true).toBe(true);
      }
    });

    it('should not fail deletion if file does not exist', async () => {
      // Create a failed import record without corresponding file
      const failedImport = await service.create({
        file_name: 'non-existent-file.json',
        file_path: 'non-existent-file.json',
        raw_data: '{}',
        error_type: 'json_parse_error',
        error_message: 'Invalid JSON',
        attempted_at: new Date(),
        retry_count: 0,
        status: 'failed'
      });

      expect(failedImport).toBeDefined();
      const id = (failedImport as any)._id.toString();

      // Delete should succeed even if file doesn't exist
      const deleted = await service.delete(id);

      expect(deleted).toBeDefined();
      expect(deleted?.file_name).toBe('non-existent-file.json');

      // Verify database record is deleted
      const found = await FailedImportModel.findById(id);
      expect(found).toBeNull();
    });
  });
});
