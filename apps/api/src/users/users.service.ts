import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import type { UserResponse } from '../domain/contracts';
import { PrismaService } from '../database/prisma.service';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import type { UserListResponse } from './contracts/user-list.contract';
import { toUserResponse } from './user.mapper';

const USER_SORT_FIELDS = new Set(['createdAt', 'email', 'name', 'updatedAt']);

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentUser(userId: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('The user was not found.');
    return toUserResponse(user);
  }

  async updateCurrentUser(
    userId: string,
    input: UpdateProfileDto,
  ): Promise<UserResponse> {
    const data: { avatarUrl?: string | null; displayName?: string } = {};
    if (input.displayName !== undefined) {
      data.displayName = input.displayName.trim();
    }
    if (input.avatarUrl !== undefined) {
      data.avatarUrl = input.avatarUrl?.trim() || null;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    return toUserResponse(user);
  }

  async listUsers(query: PaginationQueryDto): Promise<UserListResponse> {
    const sort = this.parseSort(query.sort);
    const search = query.search?.trim();
    const where = search
      ? {
          OR: [
            { displayName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const skip = (query.page - 1) * query.limit;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: sort,
        skip,
        take: query.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map(toUserResponse),
      meta: {
        limit: query.limit,
        page: query.page,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  private parseSort(sort = 'createdAt:desc') {
    const [field, direction] = sort.split(':') as [string, 'asc' | 'desc'];
    if (!USER_SORT_FIELDS.has(field)) {
      throw new BadRequestException(`Unsupported user sort field: ${field}`);
    }
    return { [field === 'name' ? 'displayName' : field]: direction };
  }
}
