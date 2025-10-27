import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';
import { FailedImportErrorType, FailedImportStatus } from './types';

@modelOptions({
  schemaOptions: {
    collection: 'failedimports',
    timestamps: true
  }
})
export class FailedImport {
  @prop({ required: true })
  file_name!: string;

  @prop({ required: true })
  file_path!: string;

  @prop({ required: true, type: String })
  raw_data!: string;

  @prop({
    required: true,
    enum: Object.values(FailedImportErrorType)
  })
  error_type!: FailedImportErrorType;

  @prop({ required: true })
  error_message!: string;

  @prop({ type: Object })
  error_details?: any;

  @prop({ required: true, default: () => new Date() })
  attempted_at!: Date;

  @prop({ default: 0 })
  retry_count!: number;

  @prop({
    enum: Object.values(FailedImportStatus),
    default: FailedImportStatus.Failed
  })
  status!: FailedImportStatus;

  @prop()
  fixed_at?: Date;

  @prop()
  last_retry_at?: Date;

  @prop()
  notes?: string;

  // Timestamps managed by Mongoose
  createdAt?: Date;
  updatedAt?: Date;
}

export const FailedImportModel = getModelForClass(FailedImport);
