/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reaction, ReactionType } from './reaction.entity';
import { Post } from 'src/post/post.entity';
import { User } from 'src/user/user.entity';
import { Reel } from 'src/reel/reel.entity';

@Injectable()
export class ReactionService {
  constructor(
    @InjectRepository(Reaction) private reactionRepo: Repository<Reaction>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Reel) private readonly reelRepo: Repository<Reel>, // ✅ أضفنا هاد

  ) {}

  async toggleReaction(
    userId: string,
    postId: string,
    type: ReactionType
  ): Promise<{ reacted: boolean; type?: ReactionType }> {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.reactionRepo.findOne({
      where: { user: { id: userId }, post: { id: postId } },
      relations: ['user', 'post'],
    });

    if (existing) {
      if (existing.type === type) {
        await this.reactionRepo.delete(existing.id);
        return { reacted: false };
      }

      // different type -> update to new type
      existing.type = type;
      await this.reactionRepo.save(existing);
      return { reacted: true, type: existing.type };
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const reaction = this.reactionRepo.create({
      type,
      user,
      post,
    });
    await this.reactionRepo.save(reaction);
    return { reacted: true, type };
  }

  async getPostReactionsCount(postId: string) {
    const qb = this.reactionRepo.createQueryBuilder('reaction')
      .select('reaction.type', 'type')
      .addSelect('COUNT(reaction.id)', 'count')
      .where('reaction.postId = :postId', { postId })
      .groupBy('reaction.type');

    const rows: { type: ReactionType; count: string }[] = await qb.getRawMany();
    const result: Record<string, number> = {};
    rows.forEach((r) => {
      result[r.type] = parseInt(r.count, 10);
    });
    return result;
  }

  async toggleReelReaction(userId: string, reelId: string, type: ReactionType) {
  const reel = await this.reelRepo.findOne({ where: { id: reelId } });
  if (!reel) throw new NotFoundException('Reel not found');

  const existing = await this.reactionRepo.findOne({
    where: { user: { id: userId }, reel: { id: reelId } },
    relations: ['user', 'reel'],
  });

  if (existing) {
    if (existing.type === type) {
      await this.reactionRepo.delete(existing.id);
      return { reacted: false };
    }
    existing.type = type;
    await this.reactionRepo.save(existing);
    return { reacted: true, type: existing.type };
  }

  const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');
  const reaction = this.reactionRepo.create({ type, user, reel });
  await this.reactionRepo.save(reaction);

  return { reacted: true, type };
}

  // async getUserReaction(user: User, postId: string) {
  //   const reaction = await this.reactionRepo.findOne({
  //     where: { user: { id: user.id }, post: { id: postId } },
  //   });
  //   return reaction ? reaction.type : null;
  // }
}
