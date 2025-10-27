import { Server } from '@hapi/hapi';
import { registerFailedImportsAdminRoutes } from './failed-imports';
import { registerUsersAdminRoutes } from './users';
import { registerBrandsAdminRoutes } from './brands';
import { registerProgramRoutes } from './programs';
import { registerProgramMembershipRoutes } from './program-memberships';
import { registerTaskRoutes } from './tasks';
import { registerWorkersAdminRoutes } from './workers';

export async function registerAdminRoutes(server: Server): Promise<void> {
  // Register workers routes (download, ETL, etc.)
  registerWorkersAdminRoutes(server);

  // Register failed imports routes
  registerFailedImportsAdminRoutes(server);

  // Register users routes
  await registerUsersAdminRoutes(server);

  // Register brands routes
  await registerBrandsAdminRoutes(server);

  // Register programs routes
  registerProgramRoutes(server);

  // Register program memberships routes
  registerProgramMembershipRoutes(server);

  // Register tasks routes
  registerTaskRoutes(server);
}
