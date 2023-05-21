import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Res } from '@nestjs/common';
import { RoleSystemService } from './role-system.service';
import { CreateRoleSystemDto } from './dto/create-role-system.dto';
import { UpdateRoleSystemDto } from './dto/update-role-system.dto';
import { ApiTags } from '@nestjs/swagger';

import { Response } from 'express';

@ApiTags('Role System')
@Controller('role-system')
export class RoleSystemController {
  constructor(private readonly roleSystemService: RoleSystemService) {}

  @Post('/role')
  async createRole(@Body() createRoleSystemDto: CreateRoleSystemDto, @Res() res: Response) {
    const response = await this.roleSystemService.createRole(createRoleSystemDto);

    return res.status(200).json({ message: `role was succesfully created`, response });
  }

  @Get('/role')
  async findAllRoles() {
    return await this.roleSystemService.findAllRoles();
  }

  @Get('/role/:id')
  async findRoleById(@Param('id') id: string) {
    return await this.roleSystemService.findRoleById(id);
  }

  @Get()
  async findRoleByName(@Query('name') name: string, @Res() res: Response) {
    const response = await this.roleSystemService.findRoleByName(name);

    return res.status(200).json(response);
  }

  @Patch('/role/:id')
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

  @Delete('/role/:id')
  async removeRole(@Param('id') id: string, @Res() res: Response) {
    const response = await this.roleSystemService.deleteRole(id);

    return res
      .status(200)
      .json({ message: `role with id: ${response.id} was succesfully deleted` });
  }
}
