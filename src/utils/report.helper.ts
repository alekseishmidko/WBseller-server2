import { Good } from '@prisma/client';
import {
  countSalesBySANameSingle,
  SaArraySingle,
  WbApiResSingle,
} from 'src/types/report.types';

export const filterArrByParams = (
  arr: WbApiResSingle[],
  searchString: string,
  param1: string,
  param2?: string,
) => {
  if (!param1 && !param2) return [];
  if (param1 && !param2) {
    return arr.filter((item) => {
      return item[param1] === searchString;
    });
  }
  if (param1 && param2) {
    return arr.filter((item) => {
      return item[param1] === searchString && item[param2] === searchString;
    });
  }
  return [];
};

export const totalService = (arr: WbApiResSingle[], field: string) => {
  if (!arr || !field) return '';
  if (arr && field) {
    return arr.reduce((sum, item) => {
      return sum + item[field];
    }, 0);
  }
};

export function countSalesBySAName(data: WbApiResSingle[]): SaArraySingle[] {
  const salesCountMap = new Map();

  data.forEach((item) => {
    const { sa_name, ts_name, supplier_oper_name, nm_id } = item;

    if (supplier_oper_name === 'Продажа') {
      if (!salesCountMap.has(sa_name)) {
        salesCountMap.set(sa_name, new Set());
      }
      salesCountMap.get(sa_name).add({ ts_name, nm_id });
    }
  });

  const result = [];
  for (const [sa_name, ts_names] of salesCountMap) {
    ts_names.forEach((obj) => {
      result.push({ sa_name, ...obj }); // Добавление sa_name и объекта из Set, распыление свойств
    });
  }

  return result;
}

export const tradesTableService = (
  saNameArray: SaArraySingle[],
  salesArray: WbApiResSingle[],
  returnsArray: WbApiResSingle[],
  defectedGoodsArr: WbApiResSingle[],
  logisticsArr: WbApiResSingle[],
  returnLogisticsArr: WbApiResSingle[],
  percentOfSellerFee: number,
  paymentOfLostGoodsArr: WbApiResSingle[],
  compensationSubstitutedGoodsArr: WbApiResSingle[],
  compensationOfTransportationCostsArr: WbApiResSingle[],
  returnsSpecial: WbApiResSingle[],
  allGoods: Good[],
): countSalesBySANameSingle[] => {
  // 1 salesArray = salesArr ,2 returnsArray = allReturnsBeforeFee,
  // 3 defectedGoodsArr = paymentOfDefectedGoodsArr,4 logisticsArr = logisticsArr,
  // 5 returnLogisticsArr = returnLogisticsArr, 6 percentOfSellerFee =sellerPercentOfFee
  // 7 paymentOfLostGoodsArr = paymentOfLostGoodsArr, 8 compensationSubstitutedGoodsArr=compensationSubstitutedGoodsArr
  // 9 compensationOfTransportationCostsArr , 10 returnsSpecial , allGoods
  const result = [];
  const uniqueCombinations = new Set();

  saNameArray.forEach(({ sa_name, ts_name, nm_id }) => {
    const combination = `${sa_name}-${ts_name}`;
    if (!uniqueCombinations.has(combination)) {
      uniqueCombinations.add(combination);
      // sales
      const totalSales = salesArray
        .filter((item) => item.sa_name === sa_name && item.ts_name === ts_name)
        .reduce((acc, item) => acc + item.ppvz_for_pay, 0);
      const totalSalesCount = salesArray.filter(
        (item) => item.sa_name === sa_name && item.ts_name === ts_name,
      );

      // returns
      const returnsTotalPrice = returnsArray
        .filter((item) => item.sa_name === sa_name && item.ts_name === ts_name)
        .reduce((acc, item) => acc + item.ppvz_for_pay, 0);
      const returnsCount = returnsSpecial.filter(
        (item) => item.sa_name === sa_name && item.ts_name === ts_name,
      );
      // logistics
      const logisticsTotalPrice = logisticsArr
        .filter((item) => item.sa_name === sa_name && item.ts_name === ts_name)
        .reduce((acc, item) => acc + item.delivery_rub, 0);
      const returnLogisticsTotalPrice = returnLogisticsArr
        .filter((item) => item.sa_name === sa_name && item.ts_name === ts_name)
        .reduce((acc, item) => acc + item.delivery_rub, 0);
      // fee
      const feeTotalPrice = (totalSales * percentOfSellerFee) / 100;
      // defected goods
      const defectedGoodsTotalPrice = defectedGoodsArr
        .filter((item) => item.sa_name === sa_name && item.ts_name === ts_name)
        .reduce((acc, item) => acc + item.ppvz_for_pay, 0);
      const defectedGoodsCount = defectedGoodsArr.filter(
        (item) => item.sa_name === sa_name && item.ts_name === ts_name,
      );

      // lost goods
      const lostGoodsTotalPrice = paymentOfLostGoodsArr
        .filter((item) => item.sa_name === sa_name && item.ts_name === ts_name)
        .reduce((acc, item) => acc + item.ppvz_for_pay, 0);
      //Substituted Goods
      const substitutedGoodsTotalPrice = compensationSubstitutedGoodsArr
        .filter((item) => item.sa_name === sa_name && item.ts_name === ts_name)
        .reduce((acc, item) => acc + item.ppvz_for_pay, 0);
      // compensation of Transportation
      const compensationOfTransportationTotalPrice =
        compensationOfTransportationCostsArr
          .filter(
            (item) => item.sa_name === sa_name && item.ts_name === ts_name,
          )
          .reduce((acc, item) => acc + item.ppvz_for_pay, 0);

      result.push({
        nm_id,
        sa_name,
        ts_name,
        totalSales: totalSales,
        totalSalesCount: totalSalesCount.length,
        returnsTotalPrice: returnsTotalPrice,
        returnsCount: returnsCount.length,
        logisticsTotalPrice: logisticsTotalPrice,
        returnLogisticsTotalPrice: returnLogisticsTotalPrice,
        feeTotalPrice: feeTotalPrice,
        defectedGoodsTotalPrice: defectedGoodsTotalPrice,
        defectedGoodsCount: defectedGoodsCount.length,
        lostGoodsTotalPrice: lostGoodsTotalPrice,
        substitutedGoodsTotalPrice: substitutedGoodsTotalPrice,
        compensationOfTransportationTotalPrice:
          compensationOfTransportationTotalPrice,
      });
    }
  });
  // old part
  // return result

  // new part
  const unitsWithSelfPrice = [...result].map((sale) => {
    const foundItem = [...allGoods].find(
      (item) => item.sa_name === sale.sa_name && item.ts_name === sale.ts_name,
    );
    // console.log(foundItem, "FI");
    if (foundItem) {
      return { ...sale, price: foundItem.price };
    }

    return { ...sale, price: 0 };
  });
  return unitsWithSelfPrice;
};

export const aggregateData = (resData: WbApiResSingle[]) => {
  const aggregated = {
    allSalesBeforeFeeTotalPrice: 0, //1 (сумма продаж до уплаты налогов, издержек и тд ... оборот)
    allSalesBeforeFeeLength: 0, //2 количество продаж
    allReturnsBeforeFeeTotalPrice: 0, //3
    allReturnsBeforeFeeLength: 0, //4
    allSalesAfterFee: 0, //5
    allReturnsAfterFee: 0, //6
    paymentOfDefectedGoods: 0, //9
    quantityOfDefectiveGoods: 0, // 10
    paymentOfLostGoods: 0, // 11
    quantityOfLostGoods: 0, //  12
    compensationSubstitutedGoods: 0, //13
    quantityOfSubstitutedGoods: 0, //14
    compensationOfTransportationCosts: 0, //15
    compensationOfTransportationCostsAmount: 0, //16
    stornoOfTrades: 0, // 17
    quantityOfStornoOfTrades: 0, //18
    correctTrades: 0, //19
    quantityOfCorrectTrades: 0, //20
    stornoOfReturns: 0, //21
    stornoOfReturnsAmount: 0, //22
    correctOfReturns: 0, //23
    correctOfReturnsAmount: 0, //24
    totalCorrect: 0, //25
    totalRetailAmountFromSales: 0, //27 (расчет 27 из таблицы -returnsSpecial сумма по retail_amount )
    logistics: 0, //29
    returnLogistics: 0, //31
    totalLogisticsCount: 0, // 34
    totalPenalty: 0, //35

    totalAdditionalPayment: 0, //36
    keeping: 0, //37
    paymentEnter: 0, // 38
    otherDed: 0, // 39
    totalSalesAndReturnsLength: 0,
  };

  resData.forEach((item) => {
    switch (item.doc_type_name) {
      case 'Продажа':
        aggregated.allSalesBeforeFeeTotalPrice +=
          item.retail_price_withdisc_rub;
        aggregated.allSalesAfterFee += item.ppvz_for_pay;
        aggregated.totalRetailAmountFromSales += item.retail_amount;
        aggregated.allSalesBeforeFeeLength++;
        break;
      case 'Возврат':
        aggregated.allReturnsBeforeFeeTotalPrice +=
          item.retail_price_withdisc_rub;
        aggregated.allReturnsAfterFee += item.ppvz_for_pay;
        aggregated.allReturnsBeforeFeeLength++;
        break;
    }

    switch (item.supplier_oper_name) {
      case 'Оплата брака':
        aggregated.paymentOfDefectedGoods += item.ppvz_for_pay;
        aggregated.quantityOfDefectiveGoods++;
        break;
      case 'Оплата потерянного товара':
        aggregated.paymentOfLostGoods += item.ppvz_for_pay;
        aggregated.quantityOfLostGoods++;
        break;
      case 'Компенсация подмененного товара':
        aggregated.compensationSubstitutedGoods += item.ppvz_for_pay;
        aggregated.quantityOfSubstitutedGoods++;
        break;
      case 'Возмещение издержек по перевозке':
        aggregated.compensationOfTransportationCosts += item.ppvz_for_pay;
        aggregated.compensationOfTransportationCostsAmount++;
        break;
      case 'Сторно продаж':
        aggregated.stornoOfTrades += item.ppvz_for_pay;
        aggregated.quantityOfStornoOfTrades++;
        break;
      case 'Корректная продажа':
        aggregated.correctTrades += item.ppvz_for_pay;
        aggregated.quantityOfCorrectTrades++;
        break;
      case 'Сторно возвратов':
        aggregated.stornoOfReturns += item.ppvz_for_pay;
        aggregated.stornoOfReturnsAmount++;
        break;
      case 'Корректный возврат':
        aggregated.correctOfReturns += item.ppvz_for_pay;
        aggregated.correctOfReturnsAmount++;
        break;
      case 'Штрафы':
        aggregated.totalPenalty += item.penalty;
        break;
      case 'Доплаты':
        aggregated.totalAdditionalPayment += item.additional_payment;
        break;
    }

    if (item.delivery_amount > 0) {
      aggregated.logistics += item.delivery_rub;
    }

    if (item.return_amount > 0) {
      aggregated.returnLogistics += item.delivery_rub;
    }

    aggregated.keeping += item.storage_fee || 0;
    aggregated.paymentEnter += item.acceptance || 0;
    aggregated.otherDed += item.deduction || 0;
  });

  aggregated.totalCorrect =
    aggregated.correctTrades -
    aggregated.stornoOfTrades +
    aggregated.stornoOfReturns -
    aggregated.correctOfReturns; //  ( 19-17+21-23)

  return aggregated;
};
