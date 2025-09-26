import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Category } from '../category/category.entity';
import { CreateCategoryDto } from '../category/dto/create-category.dto';
import { UpdateCategoryDto } from '../category/dto/update-category.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { BusinessType } from 'src/restaurant/restaurant.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    file?: Express.Multer.File,
  ): Promise<Category> {
    let imageUrl: string | undefined;

    if (file) {
      const result = await this.cloudinaryService.uploadImage(
        file,
        `categories/${createCategoryDto.name}`,
      );
      imageUrl = result.secure_url;
    }

    const category = this.categoryRepository.create({
      ...createCategoryDto,
      image_url: imageUrl,
    });

    return await this.categoryRepository.save(category);
  }

  async findAll(type?: BusinessType) {
    const categories = await this.categoryRepository.find({
      where: type ? { type } : {},
      select: ['id', 'name', 'image_url', 'type'],
    });

    return {
      category: categories.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        imageUrl: c.image_url || undefined,
      })),
    };
  }

  // async findByUser(userId: number): Promise<Category[]> {
  //     const userPreferences = await this.userPreferencesService.findOne({
  //       where: { user: { user_id: userId }, preference_type: 'favorite_food' },
  //       relations: ['user'],
  //     }) || { preference_value: null };

  //     const preferredValue = userPreferences?.preference_value || null;

  //     return this.categoryRepository
  //       .createQueryBuilder('category')
  //       .leftJoinAndSelect('category.user', 'user')
  //       .leftJoinAndSelect('category.posts', 'posts')
  //       .orderBy(
  //         `CASE WHEN category.name = :preferred THEN 0 ELSE 1 END`,
  //         'ASC'
  //       )
  //       .addOrderBy('category.name', 'ASC')
  //       .setParameter('preferred', preferredValue)
  //       .getMany();
  //   }

  findOne(id: string): Promise<Category> {
    return this.categoryRepository.findOneOrFail({ where: { id: id } });
  }

  update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    return this.categoryRepository
      .update(id, updateCategoryDto)
      .then(() => this.findOne(id));
  }

  remove(id: number): Promise<void> {
    return this.categoryRepository.delete(id).then();
  }

  async getFavoriteFoodCategories() {
    // قائمة الأصناف الستة المحددة للأكل المفضل
    const foodCategories = [
      'لحمة',
      'رز',
      'مشروبات',
      'حلويات',
      'برغر',
      'معكرونة',
    ];

    // جلب الأصناف من قاعدة البيانات مع روابط الصور إن وجدت
    const categories = await this.categoryRepository.find({
      where: { name: In(foodCategories) },
      select: ['name', 'image_url'],
    });

    // تحويل الأصناف إلى صيغة الاستجابة مع إضافة الصور
    return {
      category: foodCategories.slice(0, 6).map((category) => {
        const dbCategory = categories.find((c) => c.name === category);
        return {
          name: category,
          id: dbCategory?.id,
          imageUrl: dbCategory?.image_url || undefined,
        };
      }),
    };
  }

  async uploadCategoryImage(
    id: string,
    file: Express.Multer.File,
  ): Promise<{ message: string; imageUrl: string }> {
    const category = await this.findOne(id);

    const result = await this.cloudinaryService.uploadImage(
      file,
      `categories/${category.name}`,
    );

    category.image_url = result.secure_url;
    await this.categoryRepository.save(category);

    return {
      message: `Image uploaded successfully for category ${category.name}`,
      imageUrl: result.secure_url,
    };
  }
}
