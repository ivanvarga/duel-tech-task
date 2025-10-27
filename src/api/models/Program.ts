import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';
import { Severity } from '@typegoose/typegoose';

@modelOptions({
  schemaOptions: { collection: 'programs', timestamps: true },
  options: { allowMixed: Severity.ALLOW }
})
export class Program {
  @prop({ required: true })
  program_id!: string;

  @prop({ required: true })
  brand_id!: string;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export const ProgramModel = getModelForClass(Program);
