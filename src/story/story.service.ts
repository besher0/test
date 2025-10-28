import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In } from 'typeorm';
import { Story } from './story.entity';
import { Reaction } from './reaction.entity';
import { User } from 'src/user/user.entity';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { BusinessType } from 'src/common/business-type.enum';
import { Follow } from 'src/follow/follow.entity';

@Injectable()
export class StoryService {
  constructor(
    @InjectRepository(Story) private storyRepo: Repository<Story>,
    @InjectRepository(Reaction) private reactionRepo: Repository<Reaction>,
    private readonly cloudinaryService: CloudinaryService,

    @InjectRepository(Restaurant)
    private readonly restaurantRepo: Repository<Restaurant>,
    @InjectRepository(Follow)
    private readonly followRepo: Repository<Follow>,
  ) {}

  async createStory(
    user: User,
    dto: CreateStoryDto,
    file: Express.Multer.File | undefined,
    type: BusinessType = BusinessType.RESTAURANT,
  ) {
    const typeString =
      type === BusinessType.RESTAURANT ? 'restaurant' : 'store';
    if (user.userType !== typeString) {
      throw new ForbiddenException(
        `Only ${typeString} owners can create stories`,
      );
    }

    // ======= safer lookup using QueryBuilder (avoids findOne typings mismatch) =======
    const restaurant = await this.restaurantRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.owner', 'owner')
      .where('owner.id = :id', { id: user.id })
      .getOne();

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found for this user');
    }

    if (!restaurant.owner || restaurant.owner.id !== user.id) {
      // double-check safety (TS will stop complaining about possible null)
      throw new ForbiddenException(
        'Not allowed to add story to this restaurant',
      );
    }

    // ======= upload file (auto-detect by mimetype) =======
    let mediaUrl: string | undefined;
    let thumbnailUrl: string | undefined;

    if (file) {
      if (file.mimetype.startsWith('video/')) {
        const uploadResult = await this.cloudinaryService.uploadVideo(
          file,
          'restaurants/stories',
        );
        mediaUrl = uploadResult.secure_url;
        thumbnailUrl = this.cloudinaryService.generateThumbnail(
          uploadResult.public_id,
        );
      } else if (file.mimetype.startsWith('image/')) {
        const uploadResult = await this.cloudinaryService.uploadImage(
          file,
          'restaurants/stories',
        );
        mediaUrl = uploadResult.secure_url;
      } else {
        throw new BadRequestException('Unsupported file type');
      }
    }

    // ======= create story: pass only restaurant id to satisfy DeepPartial typing =======
    // TTL (in hours) for stories. Default: 96 hours = 4 days.
    const ttlHours = parseInt(process.env.STORY_TTL_HOURS || '96', 10);
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    const story = this.storyRepo.create({
      text: dto.text,
      mediaUrl,
      thumbnailUrl,
      restaurant: { id: restaurant.id }, // <-- important: partial object with id only
      businessType: type,
      expiresAt,
    });

    return this.storyRepo.save(story);
  }

  async updateStory(
    user: User,
    id: string,
    dto: UpdateStoryDto,
    fileUrl?: string,
    thumbnailUrl?: string,
  ) {
    const story = await this.storyRepo.findOne({
      where: { id },
      relations: ['restaurant', 'restaurant.owner'],
    });

    if (!story) throw new NotFoundException('Story not found');
    if (story.restaurant.owner.id !== user.id) {
      throw new ForbiddenException('You are not the owner of this story');
    }

    // تحديث النص إذا موجود
    if (dto.text !== undefined) {
      story.text = dto.text;
    }

    // تحديث الصورة أو الفيديو إذا انرفع ملف جديد
    if (fileUrl) {
      story.mediaUrl = fileUrl;
    }

    // تحديث الثمبنيل إذا موجود
    if (thumbnailUrl) {
      story.thumbnailUrl = thumbnailUrl;
    }

    return this.storyRepo.save(story);
  }

  async deleteStory(user: User, id: string) {
    const story = await this.storyRepo.findOne({
      where: { id },
      relations: ['restaurant', 'restaurant.owner'],
    });
    if (!story) throw new NotFoundException('Story not found');
    if (story.restaurant.owner.id !== user.id) {
      throw new ForbiddenException('You are not the owner of this story');
    }
    return this.storyRepo.remove(story);
  }

  async reactToStory(
    user: User,
    storyId: string,
    type: 'like' | 'love' | 'fire',
  ) {
    const story = await this.storyRepo.findOne({ where: { id: storyId } });
    if (!story) throw new NotFoundException('Story not found');

    let reaction = await this.reactionRepo.findOne({
      where: { story: { id: storyId }, user: { id: user.id } },
    });

    if (reaction) {
      reaction.type = type;
    } else {
      reaction = this.reactionRepo.create({ story, user, type });
    }

    return this.reactionRepo.save(reaction);
  }

  async getStoriesForUser(
    userId: string,
    type?: BusinessType,
    opts?: { limit?: number; page?: number; ownerCap?: number },
  ) {
    const now = new Date();
    const limit =
      opts?.limit && Number(opts.limit) > 0 ? Number(opts.limit) : 20;
    const ownerCap =
      opts?.ownerCap && Number(opts.ownerCap) > 0 ? Number(opts.ownerCap) : 10;
    const page = opts?.page && Number(opts.page) > 0 ? Number(opts.page) : 1;
    const skip = (page - 1) * limit;

    // 1) find restaurants owned by user (matching type if provided)
    const ownerWhere: any = { owner: { id: userId } };
    if (type) ownerWhere.type = type;
    const owned = await this.restaurantRepo.find({
      where: ownerWhere,
      select: ['id'],
    });
    const ownerRestaurantIds = owned.map((r) => r.id);
    console.log('[DEBUG stories] ownerRestaurantIds=', ownerRestaurantIds);

    // 2) fetch owner stories (cap)
    let ownerStories: Story[] = [];
    if (ownerRestaurantIds.length > 0) {
      ownerStories = await this.storyRepo.find({
        where: {
          restaurant: { id: In(ownerRestaurantIds), isActive: true },
          expiresAt: MoreThan(now),
          ...(type ? { businessType: type } : {}),
        },
        relations: [
          'restaurant',
          'restaurant.owner',
          'reactions',
          'reactions.user',
        ],
        order: { createdAt: 'DESC' },
        take: ownerCap,
      });
      console.log('[DEBUG stories] ownerStories count=', ownerStories.length);
    }

    // 3) find followed restaurants (exclude owner's restaurants to avoid duplication)
    const follows = await this.followRepo.find({
      where: { user: { id: userId }, ...(type ? { type } : {}) },
      relations: ['restaurant'],
    });
    const followedRestaurantIds = follows
      .map((f) => f.restaurant?.id)
      .filter((id): id is string => !!id && !ownerRestaurantIds.includes(id));
    console.log('[DEBUG stories] followedRestaurantIds=', followedRestaurantIds);

    // 4) fetch followed stories with page/limit (offset) pagination
    let storiesItems: Story[] = [];
    let total = 0;
    if (followedRestaurantIds.length > 0) {
      const qb = this.storyRepo
        .createQueryBuilder('s')
        .leftJoinAndSelect('s.restaurant', 'r')
        .leftJoinAndSelect('r.owner', 'owner')
        .leftJoinAndSelect('s.reactions', 'reaction')
        .leftJoinAndSelect('reaction.user', 'reactionUser')
        .where('s.expiresAt > :now', { now })
        .andWhere('r.id IN (:...rids)', { rids: followedRestaurantIds });

      if (type) qb.andWhere('s.businessType = :type', { type });

      // total count
      const countQb = this.storyRepo
        .createQueryBuilder('s')
        .leftJoin('s.restaurant', 'r')
        .where('s.expiresAt > :now', { now })
        .andWhere('r.id IN (:...rids)', { rids: followedRestaurantIds });
      if (type) countQb.andWhere('s.businessType = :type', { type });

    total = await countQb.getCount();
    console.log('[DEBUG stories] followed stories total=', total);

      qb.orderBy('s.createdAt', 'DESC')
        .addOrderBy('s.id', 'DESC')
        .skip(skip)
        .take(limit);
    storiesItems = await qb.getMany();
    console.log('[DEBUG stories] fetched storiesItems count=', storiesItems.length);
    }

    // map ownerStories and storiesItems to DTOs
    const mapStory = (story: Story) => {
      const reactionsCount = {
        like: story.reactions?.filter((r) => r.type === 'like').length ?? 0,
        love: story.reactions?.filter((r) => r.type === 'love').length ?? 0,
        fire: story.reactions?.filter((r) => r.type === 'fire').length ?? 0,
      };
      const userReaction = story.reactions?.find((r) => r.user.id === userId);
      return {
        id: story.id,
        mediaUrl: story.mediaUrl,
        thumbnailUrl: story.thumbnailUrl,
        text: story.text,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
        restaurant: story.restaurant
          ? {
              id: story.restaurant.id,
              name: story.restaurant.name,
              location: story.restaurant.location,
              logo_url: story.restaurant.logo_url,
              mainImage: story.restaurant.mainImage,
              averageRating: story.restaurant.averageRating,
            }
          : null,
        reactions: reactionsCount,
        hasReacted: userReaction ? userReaction.type : null,
      };
    };

    return {
      ownerStories: ownerStories.map(mapStory),
      stories: { items: storiesItems.map(mapStory), page, limit, total },
    };
  }
}
