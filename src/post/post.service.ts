import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './post.entity';
import { PostReaction } from './post-reaction.entity';
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

  // Get posts visible to user (page/limit pagination). Exclude posts belonging to restaurants owned by the requesting user.
  async getPostsForUser(
    type: BusinessType,
    userId: string,
    opts?: { limit?: number; page?: number },
  ) {
    const limit = opts?.limit && Number(opts.limit) > 0 ? Number(opts.limit) : 20;
    const page = opts?.page && Number(opts.page) > 0 ? Number(opts.page) : 1;
    const skip = (page - 1) * limit;

    // find restaurants owned by the requesting user (to exclude their posts)
    let ownerRestaurantIds: string[] = [];
    if (userId) {
      const owned = await this.restaurantRepo.find({
        where: { owner: { id: userId }, type },
        select: ['id'],
      });
      ownerRestaurantIds = owned.map((r) => r.id);
    }

    const qb = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.restaurant', 'restaurant')
      .leftJoinAndSelect('restaurant.owner', 'owner')
      .leftJoinAndSelect('post.reactions', 'reactions')
      .leftJoinAndSelect('reactions.user', 'reactionUser')
      .where('post.businessType = :type', { type });

    if (ownerRestaurantIds.length > 0) {
      qb.andWhere('restaurant.id NOT IN (:...ownerRestaurantIds)', {
        ownerRestaurantIds,
      });
    }

    qb.orderBy('post.createdAt', 'DESC').addOrderBy('post.id', 'DESC').skip(skip).take(limit);

    const [posts, total] = await qb.getManyAndCount();

    // (matchingStoryId feature removed) no story lookup performed

    const mapped = posts.map((post) => {
      const reactionsCount = {
        like: post.reactions?.filter((r) => r.type === 'like').length ?? 0,
        love: post.reactions?.filter((r) => r.type === 'love').length ?? 0,
        fire: post.reactions?.filter((r) => r.type === 'fire').length ?? 0,
      };

      const userReaction = post.reactions?.find((r) => r.user.id === userId);

      // matchingStoryId removed - do not compute matching story

      const rest = post.restaurant;
      const restaurantFull = rest
        ? {
            id: rest.id,
            name: rest.name,
            location: rest.location,
            latitude: rest.latitude,
            longitude: rest.longitude,
            identityImage1: rest.identityImage1 ?? null,
            identityImage2: rest.identityImage2 ?? null,
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
        reactions: reactionsCount,
        hasReacted: userReaction ? userReaction.type : null,
      };
    });

    return { items: mapped, page, limit, total };
  }
}
