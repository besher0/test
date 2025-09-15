/* eslint-disable prettier/prettier */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/user/user.entity';
import { Reaction } from 'src/reaction/reaction.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Restaurant } from 'src/restaurant/restaurant.entity';

@Entity('posts')
export class Post {
  @ApiProperty({ required: true })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Classic cheese pizza' })
  @ApiProperty({ required: true })
  @Column()
  content: string;

@ApiProperty({ required: false })
@Column({ type: 'text', nullable: true })
  mediaUrl: string|null;

  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  owner: User;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.posts, { onDelete: 'CASCADE' })
restaurant: Restaurant;

  @OneToMany(() => Reaction, (reaction) => reaction.post, { cascade: true })
  reactions: Reaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
/*

المطاعم (Restaurant)

بيقدروا يعملوا:

Posts (بوستات عادية تظهر بصفحة المتابعين).

Stories (قابلة للانتهاء بعد  48 ساعة).

البوستات والستوريز ما بتظهر إلا للمستخدمين يلي عاملين متابعة (Follow).

المستخدمين العاديين (Normal Users)

بيقدروا:

يعملوا متابعة/إلغاء متابعة للمطاعم.

يتفاعلوا مع البوستات أو الستوريز بـ 3 أنواع تفاعلات:
إعجاب (Like).
(love).
 (fire) أو أي نوع ثالث بتحدده.

ما بيقدروا ينزلوا Posts أو Stories

3. الـ Posts Entity

علاقة مع Restaurant (المطعم يلي نزل البوست).

علاقة مع User (التفاعلات).

الخصائص:

id

content (نص/ نص+صورة/نص+فيديو)

createdAt

likes, love, fire (علاقات OneToMany مع Reaction)

4. الـ Stories Entity

علاقة مع Restaurant فقط.

الخصائص:

id

mediaUrl (صورة/فيديو).

createdAt

expiresAt (وقت الانتهاء →   48 ساعة).

Logic: لما يجي أي request للـ stories، لازم الفلتر يكون:

expiresAt > NOW()

restaurant ∈ قائمة المتابعين للمستخدم
likes, love, fire (علاقات OneToMany مع Reaction)

الـ Follow

ربط بين User (العادي) وRestaurant.

من خلالها منحدد شو رح يظهر للمستخدم (Posts + Stories بس للمطاعم يلي متابعن).

الـ Flow

المطعم ينشر Post/Story → ينحفظ بقاعدة البيانات.

المستخدم العادي يسجل دخول (بالتوكن).

يظهر عنده:

Posts + Stories للمطاعم يلي متابعن فقط.

Stories لازم تتفلتر حسب expiresAt.

المستخدم بيتفاعل مع Post/Story → ينحفظ تفاعل بالـ Reaction table.

إدارة التفاعلات:

Like or love or fire → toggle (إعجاب/إلغاء).
اذا عندك اسئلة قلي
*/