import * as dayjs from 'dayjs';

export const getQuantityOfBalance = (startDate: string, endDate: string) => {
  return Math.ceil(dayjs(endDate).diff(dayjs(startDate), 'day') / 7) || 1;
};
