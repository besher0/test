import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Story } from './story.entity';
import { Reaction } from './reaction.entity';
import { User } from 'src/user/user.entity';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { BusinessType } from 'src/common/business-type.enum';

@Injectable()
export class StoryService {
  constructor(
    @InjectRepository(Story) private storyRepo: Repository<Story>,
    @InjectRepository(Reaction) private reactionRepo: Repository<Reaction>,
    private readonly cloudinaryService: CloudinaryService,

    @InjectRepository(Restaurant)
    private readonly restaurantRepo: Repository<Restaurant>,
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
    const story = this.storyRepo.create({
      text: dto.text,
      mediaUrl,
      thumbnailUrl,
      restaurant: { id: restaurant.id }, // <-- important: partial object with id only
      businessType: type,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
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

  async getStoriesForUser(userId: string, type?: BusinessType) {
    const now = new Date();

    const stories = await this.storyRepo.find({
      where: { expiresAt: MoreThan(now) },
      relations: [
        'restaurant',
        'restaurant.owner',
        'reactions',
        'reactions.user',
      ],
      order: { createdAt: 'DESC' },
    });

    const filtered = type
      ? stories.filter((s) => s.businessType === type)
      : stories;

    return filtered.map((story) => {
      const reactionsCount = {
        like: story.reactions.filter((r) => r.type === 'like').length,
        love: story.reactions.filter((r) => r.type === 'love').length,
        fire: story.reactions.filter((r) => r.type === 'fire').length,
      };

      const userReaction = story.reactions.find((r) => r.user.id === userId);

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
    });
  }
}
