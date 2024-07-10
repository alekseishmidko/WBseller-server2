import { WbApiRes } from 'src/types/report.types';

export const filterArrByParams = (
  arr: WbApiRes,
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

export const totalService = (arr: WbApiRes, field: string) => {
  if (!arr || !field) return '';
  if (arr && field) {
    return arr.reduce((sum, item) => {
      return sum + item[field];
    }, 0);
  }
};

export function countSalesBySAName(data: WbApiRes) {
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

// export function countSalesBySANameV3(data) {
//   const salesCountMap = new Map();

//   data.forEach((item) => {
//     const { sa_name, ts_name, supplier_oper_name, nm_id } = item;

//     if (supplier_oper_name === 'Продажа' && supplier_oper_name === 'продажа') {
//       if (!salesCountMap.has(sa_name)) {
//         salesCountMap.set(sa_name, new Set());
//       }
//       salesCountMap.get(sa_name).add({ ts_name, nm_id });
//     }
//   });

//   const result = [];
//   for (const [sa_name, ts_names] of salesCountMap) {
//     ts_names.forEach((obj) => {
//       result.push({ sa_name, ...obj }); // Добавление sa_name и объекта из Set, распыление свойств
//     });
//   }

//   return result;
// }

export const tradesTableService = (
  saNameArray,
  salesArray,
  returnsArray,
  defectedGoodsArr,
  logisticsArr,
  returnLogisticsArr,
  percentOfSellerFee,
  paymentOfLostGoodsArr,
  compensationSubstitutedGoodsArr,
  compensationOfTransportationCostsArr,
  returnsSpecial,
  allGoods,
) => {
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

  //
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
