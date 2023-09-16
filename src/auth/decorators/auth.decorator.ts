import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ROLES_KEY } from '../../common/constants';
import { Role } from '../../common/enums';
import { AuthGuard, RoleGuard } from '../Guard';

export const Auth = (...roles: Role[]) => {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(AuthGuard, RoleGuard),
  );
};
