import { Prisma, PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<{
  // this is needed to resolve the issue with circular types definition
  // https://github.com/prisma/prisma/issues/10203
  [K in keyof PrismaClient]: Omit<PrismaClient[K], 'groupBy'>;
}>;

export type Context = {
  prisma: PrismaClient;
};

export type MockContext = {
  prisma: DeepMockProxy<PrismaClient>;
};

type T_KEYS<T> = keyof T;
interface PrismaProps<T> {
  model: Uncapitalize<Prisma.ModelName>;
  exclude?: T_KEYS<T>[];
  id?: string;
  data?: any;
  value?: any;
}

export class PrismaMethods {
  options = new Map<string, any>();
  constructor(private readonly prisma: PrismaClient) {}

  async findMany<T>({ model, exclude }: PrismaProps<T>): Promise<T[] | null> {
    const getOptions = this.options.get(model) ?? {};

    const data: T[] = await (this.prisma as any)[model].findMany(getOptions);

    if (!data) return null;

    if (exclude) {
      data?.forEach(data => {
        exclude.forEach(key => {
          delete data[key];
        });
      });
    }

    return data;
  }

  async findUnique<T>({ model, id, exclude }: PrismaProps<T>): Promise<T | null> {
    const getOptions = this.options.get(model) ?? {};

    const data: T = await (this.prisma as any)[model].findUnique({
      ...getOptions,
      where: { id },
    });

    if (!data) return null;

    if (exclude) {
      exclude.forEach(key => {
        delete data[key];
      });
    }

    return data;
  }

  async create<T>({ model, data }: PrismaProps<T>): Promise<T | null> {
    const getOptions = this.options.get(model) ?? {};

    const createdData: T = await (this.prisma as any)[model].create({
      ...getOptions,
      data,
    });

    if (!createdData) return null;

    return createdData;
  }

  async update<T>({ model, id, data }: PrismaProps<T>): Promise<T | null> {
    const getOptions = this.options.get(model) ?? {};

    const updatedData: T = await (this.prisma as any)[model].update({
      ...getOptions,
      where: { id },
      data,
    });

    if (!updatedData) return null;

    return updatedData;
  }

  async delete<T>({ model, id }: PrismaProps<T>): Promise<T | null> {
    const getOptions = this.options.get(model) ?? {};

    console.log(getOptions);

    const deletedData: T = await (this.prisma as any)[model].delete({
      ...getOptions,
      where: { id },
    });

    if (!deletedData) return null;

    return deletedData;
  }

  async findFirst<T>({ model, exclude, value }: PrismaProps<T>): Promise<T | null> {
    const getOptions = this.options.get(model) ?? {};

    const data: T = await (this.prisma as any)[model].findFirst({
      where: { value },
      ...getOptions,
    });

    if (!data) return null;

    if (exclude) {
      exclude.forEach(key => {
        delete data[key];
      });
    }

    return data;
  }

  _configModel(model: Uncapitalize<Prisma.ModelName>, options: any) {
    this.options.set(model, options);
  }
}

/*export const createMockContext = (): MockContext => {
  return {
    prisma: mockDeep<PrismaClient>(),
  }
}*/
