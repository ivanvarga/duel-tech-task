import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';
import { Severity } from '@typegoose/typegoose';
import { Platform } from './types';

@modelOptions({
  schemaOptions: { collection: 'tasks', timestamps: true },
  options: { allowMixed: Severity.ALLOW }
})
export class Task {
  @prop({ required: true })
  task_id!: string;

  @prop({ required: true })
  user_id!: string;

  @prop({ required: true })
  program_id!: string;

  @prop({ required: true })
  membership_id!: string;

  @prop({ required: true })
  brand_id!: string;

  // Denormalized brand name for query performance optimization
  // Eliminates need for $lookup joins in analytics queries
  @prop({ required: true })
  brand_name!: string;

  @prop({ required: true, enum: Object.values(Platform) })
  platform!: Platform;

  @prop()
  post_url?: string;

  // Engagement metrics
  @prop({ default: 0 })
  likes!: number;

  @prop({ default: 0 })
  comments!: number;

  @prop({ default: 0 })
  shares!: number;

  @prop({ default: 0 })
  reach!: number;

  @prop({ default: 0 })
  engagement_rate!: number;

  @prop({ required: true })
  submitted_at!: Date;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export const TaskModel = getModelForClass(Task);
