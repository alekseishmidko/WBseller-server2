import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type ITokens = HydratedDocument<Tokens>;
@Schema()
export class Tokens {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UsersWBSeller',
    required: true,
  })
  user: mongoose.Types.ObjectId;

  @Prop({ required: true })
  refreshToken: string;
}

export const TokensSchema = SchemaFactory.createForClass(Tokens);
