import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { RoleSystemService } from './role-system.service';
import { CreateRoleSystemDto } from './dto/create-role-system.dto';
import { UpdateRoleSystemDto } from './dto/update-role-system.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Response } from 'express';
import { RoleGuard } from '../auth/guards/role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permission } from '../auth/decorator/permissio.decorator';

@ApiTags('Role System')
@ApiBearerAuth('access-token')
@Controller('role-system')
@UseGuards(JwtAuthGuard)
@UseGuards(RoleGuard)
export class RoleSystemController {
  constructor(private readonly roleSystemService: RoleSystemService) {}

  @Permission(['CREATE'])
  @Post()
  @ApiOperation({
    summary: 'Create a role',
    description: 'Creates a new role in the system.',
  })
  @ApiResponse({ status: 200, description: 'Role Created' })
  @ApiBody({ type: CreateRoleSystemDto, description: 'Role Data' })
  @ApiConsumes('multipart/form-data', 'application/json')
  async createRole(@Body() createRoleSystemDto: CreateRoleSystemDto, @Res() res: Response) {
    const response = await this.roleSystemService.createRole(createRoleSystemDto);

    return res.status(200).json({ message: `role was succesfully created`, response });
  }
  @Permission(['UPDATE'])
  @Get()
  @ApiOperation({
    summary: 'Find all roles',
    description: 'Retrieves all roles in the system.',
  })
  @ApiQuery({ name: 'name', description: 'Name of the role', required: false })
  @ApiResponse({ status: 200, description: 'Roles Found' })
  async findAllRoles(@Query('name') name: string, @Res() res: Response) {
    if (name) {
      const response = await this.roleSystemService.findRoleByName(name);
      return res.status(200).json({ message: `role was succesfully found`, data: response });
    }

    const response = await this.roleSystemService.findAllRoles();

    return res.status(200).json({ message: `roles was succesfully found`, data: response });
  }
  @Permission(['UPDATE'])
  @Get('/:id')
  @ApiOperation({
    summary: 'Find role by ID',
    description: 'Retrieves a role in the system by its ID.',
  })
  @ApiParam({ name: 'id', description: 'ID of the role' })
  @ApiResponse({ status: 200, description: 'Role Found' })
  @ApiResponse({ status: 404, description: 'Role Not Found' })
  async findRoleById(@Param('id') id: string) {
    return await this.roleSystemService.findRoleById(id);
  }

  @Permission(['UPDATE'])
  @Patch('/:id')
  @ApiOperation({
    summary: 'Update role',
    description: 'Updates a role in the system.',
  })
  @ApiParam({ name: 'id', description: 'ID of the role' })
  @ApiBody({ type: UpdateRoleSystemDto, description: 'Role Data' })
  @ApiResponse({ status: 200, description: 'Role Updated' })
  @ApiConsumes('multipart/form-data', 'application/json')
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleSystemDto: UpdateRoleSystemDto,
    @Res() res: Response,
  ) {
    const response = await this.roleSystemService.updateRole(id, updateRoleSystemDto);

    return res
      .status(200)
      .json({ message: `role with id: ${response.id} was succesfully updated` });
  }
  @Permission(['DELETE'])
  @Delete('/:id')
  @ApiOperation({
    summary: 'Remove role',
    description: 'Removes a role from the system.',
  })
  @ApiParam({ name: 'id', description: 'ID of the role' })
  @ApiResponse({ status: 200, description: 'Role Deleted' })
  async removeRole(@Param('id') id: string, @Res() res: Response) {
    const response = await this.roleSystemService.deleteRole(id);

    return res
      .status(200)
      .json({ message: `role with id: ${response.id} was succesfully deleted` });
  }
}
