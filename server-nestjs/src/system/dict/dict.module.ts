import { Module } from '@nestjs/common'
import { DictService } from './dict.service'
import { DictController } from './dict.controller'
import { DictDataService } from './dict-data.service'
import { DictDataController } from './dict-data.controller'

@Module({
  controllers: [DictController, DictDataController],
  providers: [DictService, DictDataService],
})
export class DictModule {}
