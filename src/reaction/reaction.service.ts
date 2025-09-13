/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reaction, ReactionType } from './reaction.entity';
import { Post } from 'src/post/post.entity';
import { User } from 'src/user/user.entity';

@Injectable()
export class ReactionService {
  constructor(
    @InjectRepository(Reaction) private reactionRepo: Repository<Reaction>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
  ) {}

  async toggleReaction(user: User, postId: string, type: ReactionType) {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    let reaction = await this.reactionRepo.findOne({
      where: { user: { id: user.id }, post: { id: postId } },
    });

    if (reaction) {
      // update
      reaction.type = type;
    } else {
      reaction = this.reactionRepo.create({ user, post, type });
    }

    return this.reactionRepo.save(reaction);
  }

  async getReactionsSummary(postId: string) {
    const reactions = await this.reactionRepo.find({ where: { post: { id: postId } } });
    return {
      like: reactions.filter(r => r.type === ReactionType.LIKE).length,
      love: reactions.filter(r => r.type === ReactionType.LOVE).length,
      fire: reactions.filter(r => r.type === ReactionType.FIRE).length,
    };
  }

  async getUserReaction(user: User, postId: string) {
    const reaction = await this.reactionRepo.findOne({
      where: { user: { id: user.id }, post: { id: postId } },
    });
    return reaction ? reaction.type : null;
  }
}
