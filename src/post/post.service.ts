import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './post.entity';
import { PostReaction } from './post-reaction.entity';
import { Story } from 'src/story/story.entity';
import { User } from 'src/user/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ReactToPostDto } from './dto/react-to-post.dto';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { BusinessType } from 'src/common/business-type.enum';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(PostReaction)
    private readonly reactionRepo: Repository<PostReaction>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepo: Repository<Restaurant>,
    @InjectRepository(Story)
    private readonly storyRepo: Repository<Story>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // Create a post — only restaurant/store owners (owner must be linked in Restaurant.owner)
  async createPost(
    user: User,
    dto: CreatePostDto,
    type: BusinessType,
    file?: Express.Multer.File,
  ): Promise<Post> {
    const typeString =
      type === BusinessType.RESTAURANT ? 'restaurant' : 'store';

    if (user.userType !== typeString) {
      throw new ForbiddenException(
        `Only ${typeString} owners can create posts`,
      );
    }

    const restaurant = await this.restaurantRepo.findOne({
      where: { owner: { id: user.id }, type },
      relations: ['owner'],
    });

    if (!restaurant) {
      throw new NotFoundException('No restaurant found for this user');
    }

    let mediaUrl: string | undefined;
    let thumbnailUrl: string | undefined;

    if (file) {
      if (file.mimetype.startsWith('video/')) {
        const uploadResult = await this.cloudinaryService.uploadVideo(
          file,
          'restaurants/posts',
        );
        mediaUrl = uploadResult.secure_url;
        thumbnailUrl = this.cloudinaryService.generateThumbnail(
          uploadResult.public_id,
        );
      } else if (file.mimetype.startsWith('image/')) {
        const uploadResult = await this.cloudinaryService.uploadImage(
          file,
          'restaurants/posts',
        );
        mediaUrl = uploadResult.secure_url;
      }
    }

    const post = this.postRepo.create({
      text: dto.text,
      mediaUrl,
      thumbnailUrl,
      businessType: type,
      restaurant: { id: restaurant.id },
    });

    return this.postRepo.save(post);
  }

  // Update post — only owner of restaurant
  async updatePost(user: User, id: string, dto: UpdatePostDto): Promise<Post> {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['restaurant', 'restaurant.owner'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (!post.restaurant || post.restaurant.owner.id !== user.id) {
      throw new ForbiddenException('You are not the owner of this post');
    }

    Object.assign(post, dto);
    return this.postRepo.save(post);
  }

  // Delete post — only owner of restaurant
  async deletePost(user: User, id: string): Promise<{ message: string }> {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['restaurant', 'restaurant.owner'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (!post.restaurant || post.restaurant.owner.id !== user.id) {
      throw new ForbiddenException('You are not the owner of this post');
    }

    await this.postRepo.remove(post);
    return { message: 'Post deleted successfully' };
  }

  // Add or update reaction
  async reactToPost(
    user: User,
    postId: string,
    type: ReactToPostDto['type'],
  ): Promise<PostReaction> {
    const post = await this.postRepo.findOne({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    let reaction = await this.reactionRepo.findOne({
      where: { post: { id: postId }, user: { id: user.id } },
    });

    if (reaction) {
      reaction.type = type;
    } else {
      reaction = this.reactionRepo.create({ post, user, type });
    }

    return this.reactionRepo.save(reaction);
  }

  // Get posts visible to user (here: all posts of a business type)
  async getPostsForUser(type: BusinessType, userId: string) {
    const posts = await this.postRepo.find({
      relations: [
        'restaurant',
        'restaurant.owner',
        'reactions',
        'reactions.user',
      ],
      where: { businessType: type },
      order: { createdAt: 'DESC' },
    });

    // build story lookup for posts with mediaUrl
    const storyLookup: Record<string, Story> = {};
    try {
      const mediaUrls = posts
        .map((p) => p.mediaUrl)
        .filter((u): u is string => !!u);

      const restaurantIds = posts
        .map((p) => p.restaurant?.id)
        .filter((id): id is string => !!id);

      if (this.storyRepo && mediaUrls.length > 0 && restaurantIds.length > 0) {
        const foundStories = await this.storyRepo
          .createQueryBuilder('s')
          .leftJoinAndSelect('s.restaurant', 'r')
          .where('s.mediaUrl IN (:...urls)', { urls: mediaUrls })
          .andWhere('r.id IN (:...rids)', { rids: restaurantIds })
          .getMany();

        for (const s of foundStories) {
          if (s.mediaUrl && s.restaurant?.id) {
            storyLookup[`${s.mediaUrl}|${s.restaurant.id}`] = s;
          }
        }
      }
    } catch (e) {
      // keep a small log so the linter doesn't complain about unused vars
      console.warn('story lookup failed in getPostsForUser:', e);
    }

    return posts.map((post) => {
      const reactionsCount = {
        like: post.reactions?.filter((r) => r.type === 'like').length ?? 0,
        love: post.reactions?.filter((r) => r.type === 'love').length ?? 0,
        fire: post.reactions?.filter((r) => r.type === 'fire').length ?? 0,
      };

      const userReaction = post.reactions?.find((r) => r.user.id === userId);

      let matchingKey: string | null = null;
      if (post.mediaUrl && post.restaurant?.id) {
        matchingKey = `${post.mediaUrl}|${post.restaurant.id}`;
      }

      let matchingStoryId: string | null = null;
      if (matchingKey && storyLookup[matchingKey]) {
        matchingStoryId = storyLookup[matchingKey].id;
      }

      const rest = post.restaurant;
      const restaurantFull = rest
        ? {
            id: rest.id,
            name: rest.name,
            location: rest.location,
            latitude: rest.latitude,
            longitude: rest.longitude,
            Identity: rest.Identity,
            logo_url: rest.logo_url,
            mainImage: rest.mainImage,
            description: rest.description,
            workingHours: rest.workingHours,
            type: rest.type,
            averageRating: rest.averageRating,
            createdAt: rest.createdAt,
            updatedAt: rest.updatedAt,
            owner: rest.owner
              ? {
                  id: rest.owner.id,
                  firstName: rest.owner.firstName,
                  lastName: rest.owner.lastName,
                }
              : null,
          }
        : null;

      return {
        id: post.id,
        text: post.text,
        mediaUrl: post.mediaUrl,
        thumbnailUrl: post.thumbnailUrl,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        restaurant: restaurantFull,
        matchingStoryId,
        reactions: reactionsCount,
        hasReacted: userReaction ? userReaction.type : null,
      };
    });
  }
}
