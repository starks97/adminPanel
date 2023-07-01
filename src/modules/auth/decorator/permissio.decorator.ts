import { SetMetadata } from '@nestjs/common';

import { Permissions } from '@prisma/client';
/**
 * Permission decorator is used to assign permissions to a specific endpoint or handler.
 *
 * @param permissions - An array of permissions that are required to access the endpoint or handler.
 */
export const Permission = (permissions: Permissions[]) => SetMetadata('permissions', permissions);
