import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from 'src/prisma.service';
import { SellersService } from 'src/sellers/sellers.service';
import { CreateReportDto } from './dto/create-report.dto';
import axios from 'axios';
import {
  countSalesBySAName,
  filterArrByParams,
  totalService,
  tradesTableService,
} from 'src/utils/report.helper';
import { GoodsService } from 'src/goods/goods.service';
import { WbApiResSingle } from 'src/types/report.types';
import { transformArrayToExcel } from 'src/utils/arrayToExcel';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  FirebaseStorage,
} from 'firebase/storage';
@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private sellersService: SellersService,
    private goodsService: GoodsService,
    @Inject('FIREBASE_STORAGE')
    private readonly firebaseStorage: FirebaseStorage,
  ) {}

  wbUrlGenerator(dateTo: string, dateFrom: string) {
    return `https://statistics-api.wildberries.ru/api/v5/supplier/reportDetailByPeriod?dateFrom=${dateFrom}&dateTo=${dateTo}`;
  }

  async getAllSellerReports(req: Request, userId: string) {
    const sellerId = req.query.sellerId as string;
    const isSeller = await this.sellersService.sellerMiddleware(
      sellerId,
      userId,
    );
    if (!isSeller)
      throw new BadRequestException(
        `Unauthorized! Seller ID does not match the user ID.`,
      );
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 10;
    const startIndex = (page - 1) * limit;
    const totalCount = await this.prisma.report.count({ where: { sellerId } });
    const totalPages = Math.ceil(totalCount / limit);
    const allReports = await this.prisma.report.findMany({
      where: {
        sellerId: sellerId,
      },
      orderBy: {
        dateFrom: 'desc',
      },
      skip: startIndex,
      take: limit,
    });

    if (!allReports) throw new BadRequestException('Dont find a reports!');
    return { allReports, totalPages };
  }

  async getSalesBySa(reportId: string) {
    const salesBySa = await this.prisma.countSalesBySA.findMany({
      where: { reportId },
    });
    return salesBySa;
  }
  async getOneReport(id: string, sellerId: string, userId: string) {
    const isSeller = await this.sellersService.sellerMiddleware(
      sellerId,
      userId,
    );
    if (!isSeller)
      throw new BadRequestException(
        `Unauthorized! Seller ID does not match the user ID.`,
      );

    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new BadRequestException('Dont find a report!');
    const salesBySa = await this.getSalesBySa(report.id);
    return { ...report, salesBySa };
  }

  async deleteReport(id: string, sellerId: string, userId: string) {
    const isSeller = await this.sellersService.sellerMiddleware(
      sellerId,
      userId,
    );
    if (!isSeller)
      throw new BadRequestException(
        `Unauthorized! Seller ID does not match the user ID.`,
      );

    const deletedReport = await this.prisma.report.delete({ where: { id } });
    if (!deletedReport) throw new BadRequestException('Dont find a report!');
    return { message: 'Report is successfully deleted' };
  }

  async getReportByDate(sellerId: string, dateFrom: string, dateTo: string) {
    const report = await this.prisma.report.findFirst({
      where: { sellerId, dateFrom, dateTo },
    });
    return !!report;
  }
  async createReport(req: Request, userId: string, dto: CreateReportDto) {
    const sellerId = req.query.sellerId as string;
    const url = this.wbUrlGenerator(dto.dateTo, dto.dateFrom);

    const isSeller = await this.sellersService.sellerMiddleware(
      sellerId,
      userId,
    );
    if (!isSeller)
      throw new BadRequestException(
        `Unauthorized! Seller ID does not match the user ID.`,
      );
    const isExistReport = await this.getReportByDate(
      sellerId,
      dto.dateFrom,
      dto.dateTo,
    );
    if (isExistReport)
      throw new BadRequestException(
        'You already have a report for this period!',
      );
    const seller = await this.sellersService.getSellerById(sellerId);
    const sellerPercentOfFee = seller.taxingPercent;

    const response = await axios.get<WbApiResSingle[]>(url, {
      headers: {
        Authorization: `Bearer ${seller.sellerWBtoken}`,
      },
    });

    const resData = response.data;
    if (!resData) throw new BadGatewayException('WB API is disabled');

    // сохранение репорта
    const buffer = await transformArrayToExcel([...resData]);
    // //  Сохранение буфера в хранилище Firebase
    const name = `reportId=${resData[0].realizationreport_id}$sellerId=${sellerId}$dateFrom=${dto.dateFrom}$dateTo=${dto.dateTo}.xlsx`;
    const fileRef = ref(this.firebaseStorage, name);
    await uploadBytes(fileRef, buffer);
    const downloadURL = await getDownloadURL(fileRef);
    //
    const allSalesBeforeFee = filterArrByParams(
      resData,
      'Продажа',
      'doc_type_name',
      'supplier_oper_name',
    ); //

    // const allReturnsBeforeFee = resData.filter((item) => {
    const allReturnsBeforeFee = filterArrByParams(
      resData,
      'Возврат',
      'doc_type_name',
      'supplier_oper_name',
    ); //

    const returnsSpecial = filterArrByParams(
      resData,
      'Возврат',
      'doc_type_name',
    );
    // 3
    const allReturnsBeforeFeeTotalPrice = totalService(
      allReturnsBeforeFee,
      'retail_price_withdisc_rub',
    );
    // 4 Количество возвратов
    const allReturnsBeforeFeeLength = allReturnsBeforeFee.length;
    // =2 количество продаж
    const allSalesBeforeFeeLength = allSalesBeforeFee.length;

    // =1 (сумма продаж до уплаты налогов, издержек и тд ... оборот)
    const allSalesBeforeFeeTotalPrice = allSalesBeforeFee.reduce(
      (sum, item) => {
        return sum + item.retail_price_withdisc_rub;
      },
      0,
    );

    const allSalesAfterFee = totalService(allSalesBeforeFee, 'ppvz_for_pay'); // 5

    const allReturnsAfterFee = totalService(
      allReturnsBeforeFee,
      'ppvz_for_pay',
    ); // =6

    //  =7 (( 1 - 3 ) - ( 5 - 6 ))
    const comission =
      allSalesBeforeFeeTotalPrice -
      allReturnsBeforeFeeTotalPrice -
      (allSalesAfterFee - allReturnsAfterFee);

    const paymentOfDefectedGoodsArr = filterArrByParams(
      resData,
      'Оплата брака',
      'supplier_oper_name',
    );

    const paymentOfDefectedGoods = totalService(
      paymentOfDefectedGoodsArr,
      'ppvz_for_pay',
    ); // =9

    const quantityOfDefectiveGoods = paymentOfDefectedGoodsArr.length; // =10

    const paymentOfLostGoodsArr = filterArrByParams(
      resData,
      'Оплата потерянного товара',
      'supplier_oper_name',
    );

    const paymentOfLostGoods = totalService(
      paymentOfLostGoodsArr,
      'ppvz_for_pay',
    ); // =11

    const quantityOfLostGoods = paymentOfLostGoodsArr.length; // =12
    // компенсация подмененного товара
    const compensationSubstitutedGoodsArr = filterArrByParams(
      resData,
      'Компенсация подмененного товара',
      'supplier_oper_name',
    );

    const compensationSubstitutedGoods = totalService(
      compensationSubstitutedGoodsArr,
      'ppvz_for_pay',
    ); // =13

    const quantityOfSubstitutedGoods = compensationSubstitutedGoodsArr.length; // =14

    const compensationOfTransportationCostsArr = filterArrByParams(
      resData,
      'Возмещение издержек по перевозке',
      'supplier_oper_name',
    );

    const compensationOfTransportationCosts = totalService(
      compensationOfTransportationCostsArr,
      'ppvz_for_pay',
    ); // 15

    const compensationOfTransportationCostsAmount =
      compensationOfTransportationCostsArr.length; //16

    const stornoOfTradesArr = filterArrByParams(
      resData,
      'Сторно продаж',
      'supplier_oper_name',
    );

    const stornoOfTrades = totalService(stornoOfTradesArr, 'ppvz_for_pay'); // =17

    const quantityOfStornoOfTrades = stornoOfTradesArr.length;
    const correctTradesArr = filterArrByParams(
      resData,
      'Корректная продажа',
      'supplier_oper_name',
    ); // =18

    const correctTrades = totalService(correctTradesArr, 'ppvz_for_pay'); // =19

    const quantityOfCorrectTrades = correctTradesArr.length; // =20
    //
    const stornoOfReturnsArr = filterArrByParams(
      resData,
      'Сторно возвратов',
      'supplier_oper_name',
    );

    const stornoOfReturns = totalService(stornoOfReturnsArr, 'ppvz_for_pay'); // =21

    const stornoOfReturnsAmount = stornoOfReturnsArr.length; //22
    const correctOfReturnsArr = filterArrByParams(
      resData,
      'Корректный возврат',
      'supplier_oper_name',
    );

    const correctOfReturns = totalService(correctOfReturnsArr, 'ppvz_for_pay'); // =23

    const correctOfReturnsAmount = correctOfReturnsArr.length; // =24

    const totalCorrect =
      correctTrades - stornoOfTrades + stornoOfReturns - correctOfReturns; // =25  ( 19-17+21-23)
    // =8 процент комиссии (7+25)/1
    const percentOfComission =
      (Number(comission) /
        //  + Number(totalCorrect)
        Number(allSalesBeforeFeeTotalPrice)) *
      100; // возможно стоит убрать totalCorrect ???

    const totalRetailAmountFromSales =
      resData
        .filter((item) => {
          return item.doc_type_name === 'Продажа';
        })
        .reduce((sum, item) => {
          return sum + item.retail_amount;
        }, 0) -
      +returnsSpecial.reduce((sum, item) => sum + item.retail_amount, 0); // =27 (расчет 27 из таблицы -returnsSpecial сумма по retail_amount )

    const transferForTrades =
      allSalesAfterFee - allReturnsAfterFee + totalCorrect; // =28  (5-6+25)

    const logisticsArr = resData.filter((item) => {
      return item.delivery_amount > 0;
    });

    const logistics = totalService(logisticsArr, 'delivery_rub'); // = 29

    // const quantityTotalLogistics = totalService(
    //   logisticsArr,
    //   'delivery_amount',
    // ); // =30

    const returnLogisticsArr = resData.filter((item) => {
      return item.return_amount > 0;
    });

    const returnLogistics = totalService(returnLogisticsArr, 'delivery_rub'); // =31
    // =32
    // const quantityRetornLogistics = totalService(logisticsArr, "return_amount");

    const totalLogistics = logistics + returnLogistics;
    const totalPenaltyArr = filterArrByParams(
      resData,
      'Штрафы',
      'supplier_oper_name',
    ); // =33 (29 + 31)

    const totalLogisticsCount = logisticsArr.length + returnLogisticsArr.length; // 34 totalLogisticsCount

    const totalPenalty = totalService(totalPenaltyArr, 'penalty');
    const additionalPaymentArr = filterArrByParams(
      resData,
      'Доплаты',
      'supplier_oper_name',
    ); // =35
    const totalAdditionalPayment = totalService(
      additionalPaymentArr,
      'additional_payment',
    ); // =36

    const keeping = totalService(resData, 'storage_fee'); // 37 +++
    const paymentEnter = totalService(resData, 'acceptance'); // 38 +++
    const otherDed = totalService(resData, 'deduction'); // 39 +++

    const toBePaid =
      +transferForTrades -
      +totalLogistics -
      +totalPenalty -
      +totalAdditionalPayment -
      keeping -
      paymentEnter -
      otherDed; //  =40 (28-33-35-36-37-38-39)

    //  какой артику и сколько продано
    const countSalesBySaArray = countSalesBySAName(resData);

    //процент выкупа ( число продаж / число продаж и возвратов) allSalesBeforeFeeLength / allSalesBeforeFeeLength+   allReturnsBeforeFeeLength
    const percentOfBuyBack =
      (allSalesBeforeFeeLength / allSalesBeforeFeeLength +
        allReturnsBeforeFeeLength) *
        100 || 0;

    // общее число продаж(вместе с возвратами)
    const totalSalesAndReturnsLength =
      Number(allSalesBeforeFeeLength) + Number(allReturnsBeforeFeeLength);

    // RESPONSE
    const salesArr = resData.filter((item) => item.doc_type_name === 'Продажа'); // специальный массив продаж

    const allGoods = await this.goodsService.getAllUserGoods(sellerId);
    const storageFee = +totalService(resData, 'storage_fee').toFixed(2); // +++
    const deduction = +totalService(resData, 'deduction').toFixed(2); // +++
    const acceptance = +totalService(resData, 'acceptance').toFixed(2); // +++

    const countSalesBySA = tradesTableService(
      countSalesBySaArray,
      salesArr,
      allReturnsBeforeFee,
      paymentOfDefectedGoodsArr,
      logisticsArr,
      returnLogisticsArr,
      sellerPercentOfFee,
      paymentOfLostGoodsArr,
      compensationSubstitutedGoodsArr,
      compensationOfTransportationCostsArr,
      returnsSpecial,
      allGoods,
    );

    const newReport = {
      sellerId: sellerId,
      dateTo: dto.dateTo,
      dateFrom: dto.dateFrom,
      realizationreport_id: resData[0].realizationreport_id,
      allSalesBeforeFeeTotalPrice: +allSalesBeforeFeeTotalPrice.toFixed(2), //1
      allSalesBeforeFeeLength, //2
      allReturnsBeforeFeeTotalPrice: +allReturnsBeforeFeeTotalPrice.toFixed(2), //3
      allReturnsBeforeFeeLength, //4
      allSalesAfterFee: +allSalesAfterFee.toFixed(2), //5
      allReturnsAfterFee: +allReturnsAfterFee.toFixed(2), //6
      comission: +comission.toFixed(2), //7
      percentOfComission: +percentOfComission.toFixed(2), //8
      paymentOfDefectedGoods: +paymentOfDefectedGoods.toFixed(2), //9
      quantityOfDefectiveGoods, // 10
      paymentOfLostGoods: +paymentOfLostGoods.toFixed(2), // 11
      quantityOfLostGoods, //  12
      compensationSubstitutedGoods: +compensationSubstitutedGoods.toFixed(2), //13
      quantityOfSubstitutedGoods, //14
      compensationOfTransportationCosts:
        +compensationOfTransportationCosts.toFixed(2), //15
      compensationOfTransportationCostsAmount, //16
      stornoOfTrades: +stornoOfTrades.toFixed(2), //17
      quantityOfStornoOfTrades, // 18
      correctTrades: +correctTrades.toFixed(2), //19
      quantityOfCorrectTrades, //20
      stornoOfReturns: +stornoOfReturns.toFixed(2), //21
      stornoOfReturnsAmount, //22
      correctOfReturns: +correctOfReturns.toFixed(2), //23
      correctOfReturnsAmount, //24
      totalCorrect: +totalCorrect.toFixed(2), //25
      totalRetailAmountFromSales: +totalRetailAmountFromSales.toFixed(2), //27
      transferForTrades: +transferForTrades.toFixed(2), //28
      logistics: +logistics.toFixed(2), //29
      returnLogistics: +returnLogistics.toFixed(2), //31
      // totalLogistics: +totalLogistics.toFixed(2), //33
      totalLogisticsCount: totalLogisticsCount, // 34
      totalPenalty: +totalPenalty.toFixed(2), //35
      totalAdditionalPayment: +totalAdditionalPayment.toFixed(2), //36
      totalKeeping: storageFee, // 37
      paidAcceptance: acceptance, // 38
      otherDeductions: deduction, // 39
      toBePaid: +toBePaid.toFixed(2), //40 (без вычета 37, 38, 39)
      percentOfBuyBack: +percentOfBuyBack.toFixed(2),
      totalSalesAndReturnsLength,
      downloadLink: downloadURL,
    };

    const report = await this.prisma.report.create({
      data: {
        ...newReport,
        countSalesBySA: {
          create: [...countSalesBySA],
        },
      },
      include: {
        countSalesBySA: true,
      },
    });
    return report;
  }
}
