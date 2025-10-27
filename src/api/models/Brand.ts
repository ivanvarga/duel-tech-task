import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';
import { Severity } from '@typegoose/typegoose';

@modelOptions({
  schemaOptions: { collection: 'brands', timestamps: true },
  options: { allowMixed: Severity.ALLOW }
})
export class Brand {
  @prop({ required: true })
  brand_id!: string;

  @prop({ required: true })
  name!: string;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export const BrandModel = getModelForClass(Brand);
