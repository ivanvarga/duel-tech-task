import { prop } from '@typegoose/typegoose';
import { Task } from './Task';

export class AdvocacyProgram {
  // Reference to Brand collection
  @prop({ required: true })
  program_id!: string;

  // Denormalized for quick access (synced from Brand)
  @prop({ required: false })
  brand?: string;

  @prop({ required: false })
  joined_at?: Date;

  @prop({ type: () => [Task], default: [] })
  tasks_completed!: Task[];

  @prop({ default: 0 })
  total_sales_attributed!: number;
}
