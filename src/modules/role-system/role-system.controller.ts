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
import { ApiTags } from '@nestjs/swagger';

import { Response } from 'express';
import { RoleGuard } from '../auth/guards/role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permission } from '../auth/decorator/permissio.decorator';

@ApiTags('Role System')
@Controller('role-system')
@UseGuards(JwtAuthGuard)
@UseGuards(RoleGuard)
export class RoleSystemController {
  constructor(private readonly roleSystemService: RoleSystemService) {}

  @Permission(['CREATE'])
  @Post()
  async createRole(@Body() createRoleSystemDto: CreateRoleSystemDto, @Res() res: Response) {
    const response = await this.roleSystemService.createRole(createRoleSystemDto);

    return res.status(200).json({ message: `role was succesfully created`, response });
  }
  @Permission(['UPDATE'])
  @Get()
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
  async findRoleById(@Param('id') id: string) {
    return await this.roleSystemService.findRoleById(id);
  }

  @Permission(['UPDATE'])
  @Patch('/:id')
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
  async removeRole(@Param('id') id: string, @Res() res: Response) {
    const response = await this.roleSystemService.deleteRole(id);

    return res
      .status(200)
      .json({ message: `role with id: ${response.id} was succesfully deleted` });
  }
}
