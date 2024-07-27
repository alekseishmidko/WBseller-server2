import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import axios from 'axios';
import { Request } from 'express';
import { PrismaService } from 'src/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CheckPaymentDto } from './dto/check-payment.dto';
import { promos } from 'src/helpers/promo/promo';
import { UsersService } from 'src/users/users.service';
import { TariffService } from 'src/tariff/tariff.service';
import { Tariff } from '@prisma/client';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private tariffsService: TariffService,
  ) {}

  determineAdditionalBalance(name: string) {
    const promo = promos.find((item) => item.name === name);
    if (!promo) {
      return 0;
    }
    return promo.count || 0;
  }

  determineTariffByPrice(price: number, tariffs: Tariff[]) {
    const tariff = tariffs.find((item) => item.price === price);

    return tariff;
  }

  determineCurrentTariffIndex = (userTariffName: string, tariffs: Tariff[]) => {
    const currentTariffIndex = tariffs.find(
      (item) => item.name === userTariffName,
    ).index;

    return currentTariffIndex;
  };

  async getAllUserTransactions(req: Request, userId: string) {
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 10;
    const startIndex = (page - 1) * limit;
    const totalCount = await this.prisma.payment.count({ where: { userId } });
    const totalPages = Math.ceil(totalCount / limit);
    const allTransactions = await this.prisma.payment.findMany({
      where: { userId },
      skip: startIndex,
      take: limit,
    });

    if (!allTransactions)
      throw new BadRequestException('Dont find a transactions!');

    return { allTransactions, totalPages };
  }

  async createPayment(dto: CreatePaymentDto) {
    try {
      const { data } = await axios({
        method: 'POST',
        url: 'https://api.yookassa.ru/v3/payments',
        headers: {
          'Content-Type': 'application/json',
          'Idempotence-Key': Date.now(),
        },
        auth: {
          username: process.env.YC_SHOP_ID,
          password: process.env.YC_SECRET_KEY,
        },
        data: {
          amount: {
            value: dto.value,
            currency: 'RUB',
          },
          capture: true,
          confirmation: {
            type: 'redirect',
            return_url: `${process.env.CLIENT_URL}/account/payment`,
          },
          description: `Order_${dto.value}`,
        },
      });

      return data;
    } catch (error) {
      throw new BadGatewayException('Error in createPayment');
    }
  }

  async checkPayment(dto: CheckPaymentDto, userTariff: string, userId: string) {
    try {
      const { data } = await axios({
        method: 'GET',
        url: `https://api.yookassa.ru/v3/payments/${dto.paymentId}`,
        auth: {
          username: process.env.YC_SHOP_ID,
          password: process.env.YC_SECRET_KEY,
        },
      });

      if (data.status === 'succeeded') {
        const isPaymentExist = await this.prisma.payment.findUnique({
          where: { paymentId: dto.paymentId },
        });

        if (!isPaymentExist) {
          const balanceByPromocode = this.determineAdditionalBalance(
            dto.promo || '',
          );
          const tariffs = await this.tariffsService.findAll();
          const newTariff = this.determineTariffByPrice(
            +data.amount.value,
            tariffs,
          );

          const currentTariffIndex = this.determineCurrentTariffIndex(
            userTariff,
            tariffs,
          );

          if (newTariff.index > currentTariffIndex) {
            await this.usersService.updateUserTariff(userId, newTariff.name);
          }

          const balanceTotalToUpdate = +balanceByPromocode + +newTariff.count;

          await this.usersService.updateUserBalance(
            userId,
            balanceTotalToUpdate,
          );

          await this.prisma.payment.create({
            data: {
              userId,
              paymentId: dto.paymentId,
              amount: Number(data.amount.value),
              currency: data.amount.currency,
              createdAt: data.created_at,
            },
          });

          return { message: 'Payment is confirmed!' };
        } else {
          throw new BadRequestException('Payment is exist yet!');
        }
      } else {
        throw new BadGatewayException('Payment is failed!');
      }
    } catch (error) {
      throw new BadGatewayException('Error in checkPayment');
    }
  }
}
