import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';
import { Severity } from '@typegoose/typegoose';

@modelOptions({
  schemaOptions: { collection: 'program_memberships', timestamps: true },
  options: { allowMixed: Severity.ALLOW }
})
export class ProgramMembership {
  @prop({ required: true })
  membership_id!: string;

  @prop({ required: true })
  program_id!: string;

  @prop({ required: true })
  user_id!: string;

  @prop({ required: true })
  brand_id!: string;

  @prop({ required: true })
  joined_at!: Date;

  // Performance metrics per user per program
  @prop({ default: 0 })
  tasks_completed!: number;

  @prop({ default: 0 })
  sales_attributed!: number;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export const ProgramMembershipModel = getModelForClass(ProgramMembership);
