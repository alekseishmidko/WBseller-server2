import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type IGoods = HydratedDocument<Goods>;
@Schema()
export class Goods {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SellersWBSeller',
    required: true,
  })
  sellerId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true })
  sa_name: string;

  @Prop({ required: true })
  ts_name: string;

  @Prop({ required: true })
  price: number;
}

export const GoodsSchema = SchemaFactory.createForClass(Goods);
