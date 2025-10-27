/**
 * Application Context
 * Provides dependency injection for services across controllers
 * Similar pattern to WorkerContext used by workers
 */

import {
  UserService,
  BrandService,
  ProgramService,
  ProgramMembershipService,
  TaskService,
  FailedImportService,
  AnalyticsService
} from './services';

export interface AppServices {
  user: UserService;
  brand: BrandService;
  program: ProgramService;
  programMembership: ProgramMembershipService;
  task: TaskService;
  failedImport: FailedImportService;
  analytics: AnalyticsService;
}

export interface AppContext {
  services: AppServices;
}

/**
 * Create application context with service instances
 */
export function createAppContext(): AppContext {
  return {
    services: {
      user: new UserService(),
      brand: new BrandService(),
      program: new ProgramService(),
      programMembership: new ProgramMembershipService(),
      task: new TaskService(),
      failedImport: new FailedImportService(),
      analytics: new AnalyticsService()
    }
  };
}
