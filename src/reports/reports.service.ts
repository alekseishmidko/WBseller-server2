import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from 'src/prisma.service';
import { SellersService } from 'src/sellers/sellers.service';
import { CreateReportDto } from './dto/create-report.dto';
import axios from 'axios';
import {
  aggregateData,
  countSalesBySAName,
  filterArrByParams,
  totalService,
  tradesTableService,
} from 'src/utils/report.helper';
import { GoodsService } from 'src/goods/goods.service';
import { RowData, WbApiResSingle } from 'src/types/report.types';
import { replaceKeys, transformArrayToExcel } from 'src/utils/arrayToExcel';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  FirebaseStorage,
} from 'firebase/storage';
import * as ExcelJS from 'exceljs';
import { EditSelfPriceDto, UpdateReportDto } from './dto/update-report.dto';
// import { UploadReportDto } from './dto/upload-report.dto';
import { generateId } from 'src/utils/id.generator';
import { keyMapReverse } from 'src/utils/keyMap';
import { getQuantityOfBalance } from 'src/utils/balance/get-quantity-of-balance';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ReportsService {
  MAX_SIZE = 1024 * 1024 * 2;
  constructor(
    private prisma: PrismaService,
    private sellersService: SellersService,
    private goodsService: GoodsService,
    private usersService: UsersService,
    @Inject('FIREBASE_STORAGE')
    private readonly firebaseStorage: FirebaseStorage,
  ) {}

  wbUrlGenerator(dateTo: string, dateFrom: string) {
    return `https://statistics-api.wildberries.ru/api/v5/supplier/reportDetailByPeriod?dateFrom=${dateFrom}&dateTo=${dateTo}`;
  }

  determineNeededBalanceForOperation(
    currentBalance: number,
    dateFrom: string,
    dateTo: string,
  ) {
    if (currentBalance < 1)
      throw new BadRequestException(
        'You dont have enough balance for this operation!',
      );

    const requiredBalanceForOperation = getQuantityOfBalance(dateFrom, dateTo);
    if (currentBalance - requiredBalanceForOperation < 1)
      throw new BadRequestException(
        'You dont have enough balance for this operation!',
      );
    return true;
  }

  async downloadReportToFirebase(
    buffer: ExcelJS.Buffer,
    sellerId: string,
    dateFrom: string,
    dateTo: string,
    reportId: string,
  ) {
    // const buffer = await transformArrayToExcel([...resData]); // сохранение репорта
    const name = `reportId=${reportId}$sellerId=${sellerId}$dateFrom=${dateFrom}$dateTo=${dateTo}.xlsx`;
    const fileRef = ref(this.firebaseStorage, name);
    await uploadBytes(fileRef, buffer);
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
  }

  async getAllSellerReports(sellerId: string, page = 1, limit = 10) {
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
      take: +limit,
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
  async getOneReport(id: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new BadRequestException('Dont find a report!');
    const salesBySa = await this.getSalesBySa(report.id);
    return { ...report, salesBySa };
  }

  async deleteReport(id: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new BadRequestException('Dont find a report!');
    await this.prisma.report.delete({ where: { id } });
    return { message: 'Report is successfully deleted' };
  }

  async getReportByDate(sellerId: string, dateFrom: string, dateTo: string) {
    const report = await this.prisma.report.findFirst({
      where: { sellerId, dateFrom, dateTo },
    });
    return !!report;
  }
  async createReport(
    sellerId: string,
    dto: CreateReportDto,
    currentBalance: number,
    userId: string,
  ) {
    const url = this.wbUrlGenerator(dto.dateTo, dto.dateFrom);

    const isExistReport = await this.getReportByDate(
      sellerId,
      dto.dateFrom,
      dto.dateTo,
    );
    this.determineNeededBalanceForOperation(
      currentBalance,
      dto.dateFrom,
      dto.dateTo,
    );

    if (isExistReport)
      throw new BadRequestException(
        'You already have a report for this period!',
      );
    const seller = await this.sellersService.getSellerById(sellerId);
    const sellerPercentOfFee = seller.taxingPercent;

    const { data: resData } = await axios.get<WbApiResSingle[]>(url, {
      headers: {
        Authorization: `Bearer ${seller.sellerWBtoken}`,
      },
    });
    if (resData.length === 0)
      throw new BadGatewayException('No data from WB API');
    if (!resData) throw new BadGatewayException('WB API is disabled');

    const buffer = await transformArrayToExcel([...resData]);
    const reportId = resData[0].realizationreport_id.toString();
    const downloadURL = await this.downloadReportToFirebase(
      buffer,
      sellerId,
      dto.dateFrom,
      dto.dateTo,
      reportId,
    );
    // const allSalesBeforeFee = filterArrByParams(
    //   resData,
    //   'Продажа',
    //   'doc_type_name',
    //   'supplier_oper_name',
    // ); //
    // const allReturnsBeforeFee = filterArrByParams(
    //   resData,
    //   'Возврат',
    //   'doc_type_name',
    //   'supplier_oper_name',
    // ); //

    const returnsSpecial = filterArrByParams(
      resData,
      'Возврат',
      'doc_type_name',
    );
    // // 3
    // const allReturnsBeforeFeeTotalPrice = totalService(
    //   allReturnsBeforeFee,
    //   'retail_price_withdisc_rub',
    // );
    // // 4 Количество возвратов
    // const allReturnsBeforeFeeLength = allReturnsBeforeFee.length;
    // // =2 количество продаж
    // const allSalesBeforeFeeLength = allSalesBeforeFee.length;

    // // =1 (сумма продаж до уплаты налогов, издержек и тд ... оборот)
    // const allSalesBeforeFeeTotalPrice = allSalesBeforeFee.reduce(
    //   (sum, item) => {
    //     return sum + item.retail_price_withdisc_rub;
    //   },
    //   0,
    // );

    // const allSalesAfterFee = totalService(allSalesBeforeFee, 'ppvz_for_pay'); // 5

    // const allReturnsAfterFee = totalService(
    //   allReturnsBeforeFee,
    //   'ppvz_for_pay',
    // ); // =6

    const paymentOfDefectedGoodsArr = filterArrByParams(
      resData,
      'Оплата брака',
      'supplier_oper_name',
    );

    // const paymentOfDefectedGoods = totalService(
    //   paymentOfDefectedGoodsArr,
    //   'ppvz_for_pay',
    // ); // =9

    // const quantityOfDefectiveGoods = paymentOfDefectedGoodsArr.length; // =10

    const paymentOfLostGoodsArr = filterArrByParams(
      resData,
      'Оплата потерянного товара',
      'supplier_oper_name',
    );

    // const paymentOfLostGoods = totalService(
    //   paymentOfLostGoodsArr,
    //   'ppvz_for_pay',
    // ); // =11

    // const quantityOfLostGoods = paymentOfLostGoodsArr.length; // =12
    // // компенсация подмененного товара
    const compensationSubstitutedGoodsArr = filterArrByParams(
      resData,
      'Компенсация подмененного товара',
      'supplier_oper_name',
    );

    // const compensationSubstitutedGoods = totalService(
    //   compensationSubstitutedGoodsArr,
    //   'ppvz_for_pay',
    // ); // =13

    // const quantityOfSubstitutedGoods = compensationSubstitutedGoodsArr.length; // =14

    const compensationOfTransportationCostsArr = filterArrByParams(
      resData,
      'Возмещение издержек по перевозке',
      'supplier_oper_name',
    );

    // const compensationOfTransportationCosts = totalService(
    //   compensationOfTransportationCostsArr,
    //   'ppvz_for_pay',
    // ); // 15

    // const compensationOfTransportationCostsAmount =
    //   compensationOfTransportationCostsArr.length; //16

    // const stornoOfTradesArr = filterArrByParams(
    //   resData,
    //   'Сторно продаж',
    //   'supplier_oper_name',
    // );

    // const stornoOfTrades = totalService(stornoOfTradesArr, 'ppvz_for_pay'); // =17

    // const quantityOfStornoOfTrades = stornoOfTradesArr.length;
    // const correctTradesArr = filterArrByParams(
    //   resData,
    //   'Корректная продажа',
    //   'supplier_oper_name',
    // ); // =18

    // const correctTrades = totalService(correctTradesArr, 'ppvz_for_pay'); // =19

    // const quantityOfCorrectTrades = correctTradesArr.length; // =20
    // //
    // const stornoOfReturnsArr = filterArrByParams(
    //   resData,
    //   'Сторно возвратов',
    //   'supplier_oper_name',
    // );

    // const stornoOfReturns = totalService(stornoOfReturnsArr, 'ppvz_for_pay'); // =21

    // const stornoOfReturnsAmount = stornoOfReturnsArr.length; //22
    // const correctOfReturnsArr = filterArrByParams(
    //   resData,
    //   'Корректный возврат',
    //   'supplier_oper_name',
    // );

    // const correctOfReturns = totalService(correctOfReturnsArr, 'ppvz_for_pay'); // =23

    // const correctOfReturnsAmount = correctOfReturnsArr.length; // =24

    // const totalCorrect =
    //   correctTrades - stornoOfTrades + stornoOfReturns - correctOfReturns; // =25  ( 19-17+21-23)
    // // =8 процент комиссии (7+25)/1

    // const totalRetailAmountFromSales =
    //   resData
    //     .filter((item) => {
    //       return item.doc_type_name === 'Продажа';
    //     })
    //     .reduce((sum, item) => {
    //       return sum + item.retail_amount;
    //     }, 0) -
    //   +returnsSpecial.reduce((sum, item) => sum + item.retail_amount, 0); // =27 (расчет 27 из таблицы -returnsSpecial сумма по retail_amount )

    // const transferForTrades =
    //   allSalesAfterFee - allReturnsAfterFee + totalCorrect; // =28  (5-6+25)

    const logisticsArr = resData.filter((item) => {
      return item.delivery_amount > 0;
    });

    // const logistics = totalService(logisticsArr, 'delivery_rub'); // = 29

    // // const quantityTotalLogistics = totalService(
    //   logisticsArr,
    //   'delivery_amount',
    // ); // =30

    const returnLogisticsArr = resData.filter((item) => {
      return item.return_amount > 0;
    });

    // const returnLogistics = totalService(returnLogisticsArr, 'delivery_rub'); // =31
    // // =32
    // // const quantityRetornLogistics = totalService(logisticsArr, "return_amount");

    // const totalLogistics = logistics + returnLogistics;
    // const totalPenaltyArr = filterArrByParams(
    //   resData,
    //   'Штрафы',
    //   'supplier_oper_name',
    // ); // =33 (29 + 31)

    // const totalLogisticsCount = logisticsArr.length + returnLogisticsArr.length; // 34 totalLogisticsCount

    // const totalPenalty = totalService(totalPenaltyArr, 'penalty');
    // const additionalPaymentArr = filterArrByParams(
    //   resData,
    //   'Доплаты',
    //   'supplier_oper_name',
    // ); // =35
    // const totalAdditionalPayment = totalService(
    //   additionalPaymentArr,
    //   'additional_payment',
    // ); // =36

    // const keeping = totalService(resData, 'storage_fee'); // 37 +++
    // const paymentEnter = totalService(resData, 'acceptance'); // 38 +++
    // const otherDed = totalService(resData, 'deduction'); // 39 +++

    const {
      allReturnsAfterFee,
      allReturnsBeforeFeeLength,
      allReturnsBeforeFeeTotalPrice,
      allSalesAfterFee,
      allSalesBeforeFeeLength,
      allSalesBeforeFeeTotalPrice,
      compensationOfTransportationCosts,
      compensationOfTransportationCostsAmount,
      compensationSubstitutedGoods,
      correctOfReturns,
      correctOfReturnsAmount,
      correctTrades,
      keeping,
      logistics,
      otherDed,
      paymentEnter,
      paymentOfDefectedGoods,
      paymentOfLostGoods,
      quantityOfCorrectTrades,
      quantityOfDefectiveGoods,
      quantityOfLostGoods,
      quantityOfStornoOfTrades,
      quantityOfSubstitutedGoods,
      returnLogistics,
      stornoOfReturns,
      stornoOfReturnsAmount,
      stornoOfTrades,
      totalAdditionalPayment,
      totalCorrect,
      totalLogisticsCount,
      totalPenalty,
      totalRetailAmountFromSales,
    } = aggregateData(resData);

    // //  =7 (( 1 - 3 ) - ( 5 - 6 ))
    const comission =
      allSalesBeforeFeeTotalPrice -
      allReturnsBeforeFeeTotalPrice -
      (allSalesAfterFee - allReturnsAfterFee);

    const percentOfComission =
      (Number(comission) /
        //  + Number(totalCorrect)
        Number(allSalesBeforeFeeTotalPrice)) *
      100; // возможно стоит убрать totalCorrect ???

    const allReturnsBeforeFee = filterArrByParams(
      resData,
      'Возврат',
      'doc_type_name',
      'supplier_oper_name',
    ); //
    const transferForTrades =
      allSalesAfterFee - allReturnsAfterFee + totalCorrect; // =28  (5-6+25)
    const totalLogistics = logistics + returnLogistics;
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
    const decrementBalance = getQuantityOfBalance(dto.dateFrom, dto.dateTo);
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
    await this.usersService.updateUserBalance(userId, -decrementBalance);
    return report;
  }

  async addAdditionalData(id: string, dto: UpdateReportDto) {
    const report = await this.prisma.report.update({
      where: { id },
      data: {
        ...dto,
      },
    });

    if (!report) {
      throw new NotFoundException('Dont find or update a report!');
    }

    return report;
  }

  async uploadReport(
    req: Request,

    sellerId: string,
    // dto: UploadReportDto,
    dateTo: string,
    dateFrom: string,
    file: Express.Multer.File,
    currentBalance: number,
    userId: string,
  ) {
    this.determineNeededBalanceForOperation(currentBalance, dateFrom, dateTo);
    if (!file) throw new BadRequestException(`File is required!`);
    if (file.size > this.MAX_SIZE)
      throw new BadRequestException(`File size exceeds 2 MB!`);

    const isExistReport = await this.getReportByDate(
      sellerId,
      dateFrom,
      dateTo,
    );
    if (isExistReport)
      throw new BadRequestException(
        'You already have a report for this period!',
      );

    const buffer = req.file.buffer;
    const reportId = generateId().toString();
    const downloadURL = await this.downloadReportToFirebase(
      buffer,
      sellerId,
      dateFrom,
      dateTo,
      reportId,
    );

    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(buffer);

    const worksheet = workbook.getWorksheet('Sheet1'); // TODO на проде сделать индекс[0] workbook.worksheets[0];
    // Получение данных из листа в виде двумерного массива
    const sheetData = worksheet.getSheetValues();
    const headers: string[] = sheetData[1] as string[];

    // preparing an array
    const data: RowData[] = sheetData.slice(2).map((row: any[]) => {
      const obj: RowData = {};
      row.forEach((value, index) => {
        const header = headers[index];
        if (header) {
          obj[header] = value;
        }
      });
      return obj;
    });
    const seller = await this.sellersService.getSellerById(sellerId);
    const sellerPercentOfFee = seller.taxingPercent;

    const resData = replaceKeys(data, keyMapReverse);
    const allSalesBeforeFee = filterArrByParams(
      resData,
      'Продажа',
      'doc_type_name',
      'supplier_oper_name',
    ); //
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
        .filter((item: WbApiResSingle) => {
          return item.doc_type_name === 'Продажа';
        })
        .reduce((sum: number, item: WbApiResSingle) => {
          return sum + item.retail_amount;
        }, 0) -
      +returnsSpecial.reduce((sum, item) => sum + item.retail_amount, 0); // =27 (расчет 27 из таблицы -returnsSpecial сумма по retail_amount )

    const transferForTrades =
      allSalesAfterFee - allReturnsAfterFee + totalCorrect; // =28  (5-6+25)

    const logisticsArr = resData.filter((item: WbApiResSingle) => {
      return item.delivery_amount > 0;
    });

    const logistics = totalService(logisticsArr, 'delivery_rub'); // = 29

    const returnLogisticsArr = resData.filter((item: WbApiResSingle) => {
      return item.return_amount > 0;
    });

    const returnLogistics = totalService(returnLogisticsArr, 'delivery_rub'); // =31

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

    const keeping = totalService(resData, 'storage_fee')
      ? totalService(resData, 'storage_fee')
      : 0; // 37 +++
    const paymentEnter = totalService(resData, 'acceptance')
      ? totalService(resData, 'acceptance')
      : 0; // 38 +++
    const otherDed = totalService(resData, 'deduction')
      ? totalService(resData, 'deduction')
      : 0; // 39 +++

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
    const storageFee = +totalService(resData, 'storage_fee').toFixed(2)
      ? +totalService(resData, 'storage_fee').toFixed(2)
      : 0; // +++
    const deduction = +totalService(resData, 'deduction').toFixed(2)
      ? +totalService(resData, 'deduction').toFixed(2)
      : 0; // +++
    const acceptance = +totalService(resData, 'acceptance').toFixed(2)
      ? +totalService(resData, 'acceptance').toFixed(2)
      : 0; // +++

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
      dateTo: dateTo,
      dateFrom: dateFrom,
      realizationreport_id: +reportId,
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
      toBePaid: toBePaid, //40 (без вычета 37, 38, 39)
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

    const decrementBalance = getQuantityOfBalance(dateFrom, dateTo);
    // const decrementBalance = getQuantityOfBalance(dto.dateFrom, dto.dateTo);
    await this.usersService.updateUserBalance(userId, -decrementBalance);
    return report;
  }

  async editSelfPriceOfUnitInReport(dto: EditSelfPriceDto) {
    const record = await this.prisma.countSalesBySA.findFirst({
      where: { reportId: dto.id, sa_name: dto.sa_name },
    });
    if (!record) {
      throw new NotFoundException('Record not found');
    }

    await this.prisma.countSalesBySA.update({
      where: { id: record.id, sa_name: dto.sa_name },
      data: { price: dto.price },
    });

    return { message: 'Price in report is updated' };
  }
}
