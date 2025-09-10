/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Category } from '../category/category.entity';
import { CreateCategoryDto } from '../category/dto/create-category.dto';
import { UpdateCategoryDto } from '../category/dto/update-category.dto';
import { UserPreferencesService } from 'src/user-preferences/user-preferences.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private readonly userPreferencesService: UserPreferencesService,
    private cloudinaryService: CloudinaryService, 


  ) {}

  create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  findAll(): Promise<Category[]> {
    return this.categoryRepository.find();
  }

async findByUser(userId: number): Promise<Category[]> {
    const userPreferences = await this.userPreferencesService.findOne({
      where: { user: { user_id: userId }, preference_type: 'favorite_food' },
      relations: ['user'],
    }) || { preference_value: null };

    const preferredValue = userPreferences?.preference_value || null;

    return this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.user', 'user')
      .leftJoinAndSelect('category.posts', 'posts') 
      .orderBy(
        `CASE WHEN category.name = :preferred THEN 0 ELSE 1 END`, 
        'ASC'
      )
      .addOrderBy('category.name', 'ASC') 
      .setParameter('preferred', preferredValue)
      .getMany();
  }

  findOne(id: number): Promise<Category> {
    return this.categoryRepository.findOneOrFail({ where: { category_id: id } });
  }

  update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    return this.categoryRepository.update(id, updateCategoryDto).then(() => this.findOne(id));
  }

  remove(id: number): Promise<void> {
    return this.categoryRepository.delete(id).then();
  }







      async getFavoriteFoodCategories() {
    // قائمة الأصناف الستة المحددة للأكل المفضل
    const foodCategories = ['meat', 'rice', 'drink', 'dessert', 'burger', 'pastry'];

    // جلب الأصناف من قاعدة البيانات مع روابط الصور إن وجدت
    const categories = await this.categoryRepository.find({
      where: { name: In(foodCategories) },
      select: ['name', 'image_url'],
    });

    // تحويل الأصناف إلى صيغة الاستجابة مع إضافة الصور
    return {
      category:foodCategories.slice(0,6).map(category => {
      const dbCategory = categories.find(c => c.name === category);
      return {
        name: category,
        imageUrl: dbCategory?.image_url || undefined,
      };
    }),
  }
    
  }

  async uploadFoodCategoryImage(name: string, file: Express.Multer.File): Promise<{ message: string; imageUrl: string }> {
    // قائمة الأصناف المسموح بها
    const allowedCategories = ['meat', 'rice', 'drink', 'dessert', 'burger', 'pastry'];
    if (!allowedCategories.includes(name)) {
      throw new BadRequestException(`Category ${name} is not a valid favorite food category`);
    }

    // رفع الصورة إلى Cloudinary
    const result = await this.cloudinaryService.uploadImage(file, `food_categories/${name}`);

    // تحديث أو إنشاء الصنف في قاعدة البيانات
    let category = await this.categoryRepository.findOne({ where: { name } });
    if (!category) {
      category = this.categoryRepository.create({
        name,
        description: `Favorite food category: ${name}`,
        image_url: result.secure_url,
      });
    } else {
      category.image_url = result.secure_url;
    }
    await this.categoryRepository.save(category);

    return {
      message: `Image uploaded successfully for category ${name}`,
      imageUrl: result.secure_url,
    };
  }
}