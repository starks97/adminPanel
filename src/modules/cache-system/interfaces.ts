import { Prisma } from '@prisma/client';
import { RedisKey, RedisValue } from 'ioredis';

export interface CacheStateProps<T> {
  model: Uncapitalize<Prisma.ModelName>;
  storeKey: string;
  exclude?: (keyof T)[];
}

export interface CachePagProps<T> extends Omit<CacheStateProps<T>, 'model' | 'exclude'> {
  newKey: string;
  offset: number;
  limit: number;
}

type RedisProps = {
  key: RedisKey;
  value: RedisValue;
  ttl: string | number;
};

export interface CacheMultiSetProps {
  redis: RedisProps[];
}
