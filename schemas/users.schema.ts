import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type IUser = HydratedDocument<User>;
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ unique: true })
  key: number;

  @Prop({ default: 0 })
  chatId: number;

  @Prop({ enum: ['user', 'admin'], default: 'user' })
  role: string;

  @Prop({ enum: ['active', 'disabled'], default: 'active' })
  status: string;

  @Prop({ required: true, default: 'Новый пользователь' })
  tariff: string;

  @Prop({ required: true, default: 2, min: 0, max: 999 })
  balance: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
