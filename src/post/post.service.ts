/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { User } from 'src/user/user.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async createPost(owner: User, dto: CreatePostDto): Promise<Post> {
    // prevent image + video at same time
    if (dto.imageUrl && dto.videoUrl) {
      throw new BadRequestException('You can only add either an image or a video, not both.');
    }
    const post = this.postRepository.create({ ...dto, owner });
    return this.postRepository.save(post);
  }

  async getAllPosts() {
    return this.postRepository.find({ relations: ['owner', 'reactions'], order: { createdAt: 'DESC' } });
  }

  async getPostsByRestaurant(restaurantOwnerId: string) {
    return this.postRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.owner', 'owner')
      .leftJoinAndSelect('post.reactions', 'reactions')
      .where('owner.id = :ownerId', { ownerId: restaurantOwnerId })
      .orderBy('post.createdAt', 'DESC')
      .getMany();
  }

  async getPostById(id: string) {
    const post = await this.postRepository.findOne({ where: { id }, relations: ['owner','reactions'] });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }
}
