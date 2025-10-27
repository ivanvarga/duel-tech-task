import { prop } from '@typegoose/typegoose';
import { DataQualitySeverity } from './types';

export class DataQuality {
  @prop({ default: true })
  is_clean!: boolean;

  @prop({ type: () => [String], default: [] })
  issues!: string[];

  @prop({ enum: Object.values(DataQualitySeverity), default: DataQualitySeverity.Clean })
  severity!: DataQualitySeverity;

  @prop({ type: () => Object })
  original_values?: Record<string, any>;
}
