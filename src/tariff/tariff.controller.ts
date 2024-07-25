import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TariffService } from './tariff.service';
import { CreateTariffDto } from './dto/create-tariff.dto';
import { UpdateTariffDto } from './dto/update-tariff.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';

@Controller('tariff')
export class TariffController {
  constructor(private readonly tariffService: TariffService) {}

  @Post()
  @Auth('admin')
  create(@Body() createTariffDto: CreateTariffDto) {
    return this.tariffService.create(createTariffDto);
  }

  @Get()
  @Auth('admin')
  findAll() {
    return this.tariffService.findAll();
  }

  @Get(':id')
  @Auth('admin')
  findOne(@Param('index') index: string) {
    return this.tariffService.findOne(+index);
  }

  @Patch(':index')
  @Auth('admin')
  update(
    @Param('index') index: string,
    @Body() updateTariffDto: UpdateTariffDto,
  ) {
    return this.tariffService.update(+index, updateTariffDto);
  }

  @Delete(':index')
  @Auth('admin')
  remove(@Param('index') index: string) {
    return this.tariffService.remove(+index);
  }
}
