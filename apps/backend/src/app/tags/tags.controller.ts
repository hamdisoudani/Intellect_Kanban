import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Req, NotFoundException, ForbiddenException } from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  async create(@Body() createTagDto: CreateTagDto, @Req() req: RequestWithUser) {
    return this.tagsService.create(createTagDto, req.user.userId);
  }

  @Post('batch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  async createMultiple(@Body() tags: CreateTagDto[], @Req() req: RequestWithUser) {
    return this.tagsService.createMultiple(tags, req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Req() req: RequestWithUser) {
    return this.tagsService.findByUser(req.user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    const tag = await this.tagsService.findOne(id);
    
    // Verify user can access this tag
    if (tag.createdBy.toString() !== req.user.userId && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only view tags you created');
    }
    
    return tag;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  async update(
    @Param('id') id: string,
    @Body() updateTagDto: UpdateTagDto,
    @Req() req: RequestWithUser
  ) {
    return this.tagsService.update(id, updateTagDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  async remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.tagsService.remove(id, req.user.userId);
  }
} 