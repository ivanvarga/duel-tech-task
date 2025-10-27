import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';
import { Severity } from '@typegoose/typegoose';

@modelOptions({
  schemaOptions: {
    collection: 'users',
    timestamps: true
  },
  options: { allowMixed: Severity.ALLOW }
})
export class User {
  @prop({ required: true })
  user_id!: string;

  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  email!: string;

  @prop()
  instagram_handle?: string;

  @prop()
  tiktok_handle?: string;

  @prop()
  joined_at?: Date;

  // Timestamps managed by Mongoose
  createdAt?: Date;
  updatedAt?: Date;
}

export const UserModel = getModelForClass(User);
