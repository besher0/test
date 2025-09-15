/* eslint-disable prettier/prettier */
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { User } from 'src/user/user.entity';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(Restaurant)
    private restaurantRepo: Repository<Restaurant>,
        private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createPost(user: User, dto: CreatePostDto, file?: Express.Multer.File) {
    if (user.userType !== 'restaurant') {
      throw new ForbiddenException('Only restaurants can create posts');
    }

    const restaurant = await this.restaurantRepo.findOne({
      where: { owner: { id: user.id } },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant profile not found');
    }

     let mediaUrl: string | null = null;
    if (file) {
      if (file.mimetype.startsWith('image/')) {
        const uploadResult = await this.cloudinaryService.uploadImage(file, 'posts/images');
        mediaUrl = uploadResult.secure_url;
      } else if (file.mimetype.startsWith('video/')) {
        const uploadResult = await this.cloudinaryService.uploadVideo(file, 'posts/videos');
        mediaUrl = uploadResult.secure_url;
      } else {
        throw new Error('Unsupported file type');
      }
    }

    const post = this.postRepo.create({
    ...dto,
    owner: user, 
    restaurant,
    mediaUrl
    });

    return this.postRepo.save(post);
  }

    async findAll(): Promise<Post[]> {
    return await this.postRepo.find({
      relations: ['owner', 'restaurant', 'reactions'],
      order: { createdAt: 'DESC' }, // الأحدث أولاً
    });
  }

  async updatePost(user: User, postId: string, dto: UpdatePostDto) {
    const post = await this.postRepo.findOne({
      where: { id: postId },
      relations: ['restaurant', 'restaurant.user'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.restaurant.owner.id !== user.id) {
      throw new ForbiddenException('You can only update your own posts');
    }

    Object.assign(post, dto);
    return this.postRepo.save(post);
  }

  async deletePost(user: User, postId: string) {
    const post = await this.postRepo.findOne({
      where: { id: postId },
      relations: ['restaurant', 'restaurant.user'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.restaurant.owner.id !== user.id) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.postRepo.remove(post);
    return { message: 'Post deleted successfully' };
  }
}
