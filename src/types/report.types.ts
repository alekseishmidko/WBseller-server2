export type PeriodType = {
  dateTo: string;
  dateFrom: string;
};

export type WbApiResSingle = {
  realizationreport_id: number;
  date_from: string;
  date_to: string;
  create_dt: string;
  currency_name: string;
  suppliercontract_code: string;
  rrd_id: number;
  gi_id: number;
  subject_name: string;
  nm_id: number;
  brand_name: string;
  sa_name: string;
  ts_name: string;
  barcode: string;
  doc_type_name: string;
  quantity: number;
  retail_price: number;
  retail_amount: number;
  sale_percent: number;
  commission_percent: number;
  office_name: string;
  supplier_oper_name: string;
  order_dt: string;
  sale_dt: string;
  rr_dt: string;
  shk_id: number;
  retail_price_withdisc_rub: number;
  delivery_amount: number;
  return_amount: number;
  delivery_rub: number;
  gi_box_type_name: string;
  product_discount_for_report: number;
  supplier_promo: number;
  rid: number;
  ppvz_spp_prc: number;
  ppvz_kvw_prc_base: number;
  ppvz_kvw_prc: number;
  sup_rating_prc_up: number;
  is_kgvp_v2: number;
  ppvz_sales_commission: number;
  ppvz_for_pay: number;
  ppvz_reward: number;
  acquiring_fee: number;
  acquiring_percent: number;
  acquiring_bank: string;
  ppvz_vw: number;
  ppvz_vw_nds: number;
  ppvz_office_name: string;
  ppvz_office_id: number;
  ppvz_supplier_id: number;
  ppvz_supplier_name: string;
  ppvz_inn: string;
  declaration_number: string;
  bonus_type_name: string;
  sticker_id: string;
  site_country: string;
  penalty: number;
  additional_payment: number;
  rebill_logistic_cost: number;
  storage_fee: number;
  deduction: number;
  acceptance: number;
  srid: string;
  report_type: number;
};

export type SaArraySingle = {
  sa_name: string;
  ts_name: string;
  nm_id: number;
};

export type countSalesBySANameSingle = {
  nm_id: number;
  sa_name: string;
  ts_name: string;
  totalSales: number;
  totalSalesCount: number;
  returnsTotalPrice: number;
  returnsCount: number;
  logisticsTotalPrice: number;
  returnLogisticsTotalPrice: number;
  feeTotalPrice: number;
  defectedGoodsTotalPrice: number;
  defectedGoodsCount: number;
  lostGoodsTotalPrice: number;
  substitutedGoodsTotalPrice: number;
  compensationOfTransportationTotalPrice: number;
  price: number;
};

export interface RowData {
  [key: string]: any;
}
