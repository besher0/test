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
import { BusinessType, Restaurant } from 'src/restaurant/restaurant.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(PostReaction)
    private readonly reactionRepo: Repository<PostReaction>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepo: Repository<Restaurant>,
  ) {}

  // Create a post — only restaurant owners (owner must be linked in Restaurant.owner)
  async createPost(
    user: User,
    dto: CreatePostDto,
    fileUrl?: string,
    thumbnailUrl?: string,
  ): Promise<Post> {
    if (user.userType !== 'restaurant') {
      throw new ForbiddenException('Only restaurant owners can create posts');
    }

    // نجيب المطعم تبع المستخدم
    const restaurant = await this.restaurantRepo.findOne({
      where: { owner: { id: user.id } },
      relations: ['owner'],
    });

    if (!restaurant) {
      throw new NotFoundException('No restaurant found for this user');
    }

    // ننشئ البوست الجديد
    const post = this.postRepo.create({
      text: dto.text,
      mediaUrl: fileUrl,
      thumbnailUrl,
      restaurant: {
        id: restaurant.id, // نخزن المطعم بشكل آمن
      },
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
      reaction = this.reactionRepo.create({
        post,
        user,
        type,
      });
    }

    return this.reactionRepo.save(reaction);
  }

  // Get posts visible to user (here: all posts; you can filter by follows if needed)
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

    return posts.map((post) => {
      const reactionsCount = {
        like: post.reactions?.filter((r) => r.type === 'like').length ?? 0,
        love: post.reactions?.filter((r) => r.type === 'love').length ?? 0,
        fire: post.reactions?.filter((r) => r.type === 'fire').length ?? 0,
      };

      const userReaction = post.reactions?.find((r) => r.user.id === userId);

      return {
        id: post.id,
        text: post.text,
        mediaUrl: post.mediaUrl,
        thumbnailUrl: post.thumbnailUrl,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        restaurant: {
          id: post.restaurant.id,
          name: post.restaurant.name,
        },
        reactions: reactionsCount,
        hasReacted: userReaction ? userReaction.type : null,
      };
    });
  }
}
