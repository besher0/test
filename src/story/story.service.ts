/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Story } from './story.entity';
import { Reaction } from './reaction.entity';
import { User } from 'src/user/user.entity';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';

@Injectable()
export class StoryService {
  constructor(
    @InjectRepository(Story) private storyRepo: Repository<Story>,
    @InjectRepository(Reaction) private reactionRepo: Repository<Reaction>,
  ) {}

  async createStory(user: User, dto: CreateStoryDto, fileUrl?: string, thumbnailUrl?: string) {
    if (user.userType !== 'restaurant') {
      throw new ForbiddenException('Only restaurant owners can create stories');
    }

    const story = this.storyRepo.create({
      ...dto,
      mediaUrl: fileUrl,
      thumbnailUrl,
      restaurant: user.restaurants[0],
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    });

    return this.storyRepo.save(story);
  }

  async updateStory(user: User, id: string, dto: UpdateStoryDto) {
    const story = await this.storyRepo.findOne({
      where: { id },
      relations: ['restaurant', 'restaurant.owner'],
    });
    if (!story) throw new NotFoundException('Story not found');
    if (story.restaurant.owner.id !== user.id) {
      throw new ForbiddenException('You are not the owner of this story');
    }
    Object.assign(story, dto);
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

  async reactToStory(user: User, storyId: string, type: 'like' | 'love' | 'fire') {
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

  async getStoriesForUser(userId: string) {
    const now = new Date();

    const stories = await this.storyRepo.find({
      where: { expiresAt: MoreThan(now) },
      relations: ['restaurant', 'restaurant.owner', 'reactions', 'reactions.user'],
      order: { createdAt: 'DESC' },
    });

    return stories.map((story) => {
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
        restaurant: {
          id: story.restaurant.id,
          name: story.restaurant.name,
        },
        reactions: reactionsCount,
        hasReacted: userReaction ? userReaction.type : null,
      };
    });
  }
}
