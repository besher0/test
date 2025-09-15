/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Reel } from './reel.entity';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { User } from 'src/user/user.entity';
import { Restaurant } from 'src/restaurant/restaurant.entity';

@Injectable()
export class ReelService {
  constructor(
    @InjectRepository(Reel) private readonly reelRepo: Repository<Reel>,
    @InjectRepository(Restaurant) private readonly restaurantRepo: Repository<Restaurant>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ✅ إنشاء ريل
  async create(user: User,  file: Express.Multer.File) {
    const restaurant = await this.restaurantRepo.findOne({
      where: { owner: { id: user.id } },
    });
    if (!restaurant) throw new NotFoundException('Restaurant profile not found');

    let mediaUrl: string;
    if (file.mimetype.startsWith('image/')) {
      const upload = await this.cloudinaryService.uploadImage(file, 'reels/images');
      mediaUrl = upload.secure_url;
    } else if (file.mimetype.startsWith('video/')) {
      const upload = await this.cloudinaryService.uploadVideo(file, 'reels/videos');
      mediaUrl = upload.secure_url;
    } else {
      throw new Error('Unsupported file type');
    }

    const reel = this.reelRepo.create({
      mediaUrl,
      restaurant,
    });

    return this.reelRepo.save(reel);
  }

  // ✅ جلب كل الريلات النشطة (آخر 48 ساعة)
  async findAllActive() {
    const expiration = new Date(Date.now() - 48 * 60 * 60 * 1000);
    return this.reelRepo.find({
      where: { createdAt: MoreThan(expiration) },
      relations: ['restaurant', 'reactions'],
    });
  }

  // ✅ جلب ريل واحد
  async findOne(id: string) {
    const reel = await this.reelRepo.findOne({
      where: { id },
      relations: ['restaurant', 'reactions'],
    });
    if (!reel) throw new NotFoundException('Reel not found');
    return reel;
  }

  // ✅ تعديل ريل
  async update(id: string) {
    const reel = await this.findOne(id);
    Object.assign(reel);
    return this.reelRepo.save(reel);
  }

  // ✅ حذف ريل
  async remove(id: string) {
    const reel = await this.findOne(id);
    await this.reelRepo.remove(reel);
    return { deleted: true };
  }
}
