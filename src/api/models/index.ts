/**
 * Model registry
 * Exports all Typegoose models and their collections
 */

export { User, UserModel } from './User';
export { FailedImport, FailedImportModel } from './FailedImport';
export { Brand, BrandModel } from './Brand';
export { Program, ProgramModel } from './Program';
export { ProgramMembership, ProgramMembershipModel } from './ProgramMembership';
export { Task, TaskModel } from './Task';
export { DataQuality } from './DataQuality';

export * from './types';

// List of all models for registration
import { UserModel } from './User';
import { FailedImportModel } from './FailedImport';
import { BrandModel } from './Brand';
import { ProgramModel } from './Program';
import { ProgramMembershipModel } from './ProgramMembership';
import { TaskModel } from './Task';

export const models = {
  User: UserModel,
  FailedImport: FailedImportModel,
  Brand: BrandModel,
  Program: ProgramModel,
  ProgramMembership: ProgramMembershipModel,
  Task: TaskModel
};

// Collection names mapping
export const collections = {
  users: 'users',
  failedImports: 'failedimports',
  brands: 'brands',
  programs: 'programs',
  programMemberships: 'program_memberships',
  tasks: 'tasks'
} as const;
