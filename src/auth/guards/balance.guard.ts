// import {
//   BadRequestException,
//   CanActivate,
//   ExecutionContext,
//   Injectable,
// } from '@nestjs/common';
// import { User } from '@prisma/client';

// import { PeriodType } from 'src/types/report.types';
// import { getQuantityOfBalance } from 'src/utils/balance/get-quantity-of-balance';

// @Injectable()
// export class BalanceGuard implements CanActivate {
//   canActivate(context: ExecutionContext): boolean {
//     const request = context
//       .switchToHttp()
//       .getRequest<{ user: User; body: PeriodType }>();
//     const { balance } = request.user;

//     // const { dateTo, dateFrom } = request.body;

//     // console.log(dateTo, dateFrom);
//     // const q = getQuantityOfBalance(dateFrom, dateTo);
//     // console.log(q);
//     if (balance < 1)
//       throw new BadRequestException(
//         'You dont have enough balance for this operation!',
//       );

//     return true;
//   }
// }
