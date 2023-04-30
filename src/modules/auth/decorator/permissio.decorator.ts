import { SetMetadata } from '@nestjs/common';

import { Permissions } from '@prisma/client';

export const Permission = (permissions: Permissions[]) => SetMetadata('permissions', permissions);
