import { Controller, Get, Post, Body, Param, Put, UseGuards, Request, UseInterceptors, ClassSerializerInterceptor, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User, UserRole } from '../entities/user.entity';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created', type: User })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid user data' })
  @ApiResponse({ status: 409, description: 'Conflict - Email already exists' })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User successfully updated', type: User })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the user or admin' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: RequestWithUser,
  ): Promise<User> {
    if (req.user.id !== id && req.user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('You can only update your own profile unless you are an admin');
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all users', type: [User] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not an admin' })
  async findAll(): Promise<User[]> {
    try {
      return await this.usersService.findAll();
    } catch {
      throw new UnauthorizedException('Failed to fetch users');
    }
  }

  @Get(':id/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile with balance and purchase history' })
  @ApiResponse({ status: 200, description: 'User profile with balance and purchase history', type: User })
  async getProfile(@Param('id') id: string): Promise<Partial<User>> {
    const user = await this.usersService.findOne(id);
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      balance: user.balance,
      purchaseHistory: user.purchaseHistory || [],
      isVerified: user.isVerified,
      isFrozen: user.isFrozen,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
