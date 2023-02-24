import { PartialType } from '@nestjs/swagger';
import { CreateCacheDto } from './create-cache.dto';

export class UpdateCacheDto extends PartialType(CreateCacheDto) {}
