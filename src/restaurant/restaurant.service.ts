// ...existing code...
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessType, Restaurant } from './restaurant.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { User } from 'src/user/user.entity';
import { Category } from 'src/category/category.entity';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Country } from 'src/country/county.entity';
import { Rating } from 'src/rating/rating.entity';
import { Meal } from 'src/meal/meal.entity';
import { RestaurantImage } from './restaurant-image.entity';
import { RestaurantVideo } from './restaurant-video.entity';
import { Follow } from 'src/follow/follow.entity';
import { RestaurantProfileDto } from './dto/RestaurantProfileDto';
import { DeliveryLocation } from './delivery-location.entity';

// واجهة Response مخصصة
export interface RestaurantResponse extends Omit<Restaurant, 'owner'> {
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    userType: string;
    email: string;
  };
}

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private restaurantRepo: Repository<Restaurant>,
    @InjectRepository(Country)
    private readonly countryRepo: Repository<Country>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    private readonly cloudinaryService: CloudinaryService,
    @InjectRepository(Rating)
    private readonly ratingRepo: Repository<Rating>,
    @InjectRepository(Meal)
    private mealRepo: Repository<Meal>,
    @InjectRepository(RestaurantImage)
    private imageRepo: Repository<RestaurantImage>,
    @InjectRepository(RestaurantVideo)
    private videoRepo: Repository<RestaurantVideo>,
    @InjectRepository(Follow)
    private readonly followRepo: Repository<Follow>,
    @InjectRepository(DeliveryLocation)
    private deliveryLocationRepo: Repository<DeliveryLocation>,
  ) {}

  private mapOwner(user: User) {
    if (!user) return null;
    console.log(user);
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      email: user.email,
    };
  }

  async create(
    dto: CreateRestaurantDto,
    currentUser: User,
    file?: Express.Multer.File,
    type?: BusinessType,
  ) {
    console.log(currentUser);
    if (!type || !['restaurant', 'store'].includes(type)) {
      throw new NotFoundException('Type must be restaurant or store');
    }

    if (!['restaurant', 'store'].includes(currentUser.userType)) {
      throw new NotFoundException('Only owners can create restaurants/stores');
    }

    let category: Category | null = null;
    if (dto.categoryId) {
      category = await this.categoryRepo.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) throw new NotFoundException('Category not found');
    }
    const owner = await this.userRepo.findOne({
      where: { id: currentUser.id },
    });
    console.log(
      '[Service.create] owner from DB =',
      owner && { id: owner.id, userType: owner.userType },
    );

    if (!owner) throw new NotFoundException('Owner not found');
    let logo_url: string | undefined;
    if (file) {
      const result = await this.cloudinaryService.uploadImage(
        file,
        `restaurants/${dto.name}`,
      );
      logo_url = result.secure_url;
    }
    const restaurant = this.restaurantRepo.create({
      ...dto,
      owner,
      logo_url,
      type,
    });

    const saved = await this.restaurantRepo.save(restaurant);

    return {
      ...saved,
      owner: this.mapOwner(owner), // ✅ مالك كامل
    };
  }
  //

  async findAll(type: BusinessType) {
    const restaurants = await this.restaurantRepo.find({
      where: { type },
      relations: ['owner', 'category'], // ✅ بس
    });

    return restaurants.map((r) => ({
      id: r.id,
      name: r.name,
      location: r.location,
      Identity: r.Identity,
      logo_url: r.logo_url,
      averageRating: r.averageRating,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      owner: this.mapOwner(r.owner), // ✅ خلي المالك كامل
    }));
  }
  //

  async findOne(id: string, type: BusinessType, user?: User) {
    const restaurant = await this.restaurantRepo.findOne({
      where: { id, type },
      relations: ['owner', 'category', 'likes', 'likes.user'],
    });

    if (!restaurant) throw new NotFoundException(`${type} not found`);

    return {
      id: restaurant.id,
      name: restaurant.name,
      location: restaurant.location,
      Identity: restaurant.Identity,
      logo_url: restaurant.logo_url,
      averageRating: restaurant.averageRating,
      createdAt: restaurant.createdAt,
      updatedAt: restaurant.updatedAt,
      owner: this.mapOwner(restaurant.owner),
      isLiked: user
        ? restaurant.likes.some((like) => like.user.id === user.id)
        : false,
    };
  }
  //

  async updateRestaurant(
    id: string,
    dto: UpdateRestaurantDto,
    mainImageFile?: Express.Multer.File,
    logoFile?: Express.Multer.File,
  ): Promise<Restaurant> {
    const restaurant = await this.restaurantRepo.findOne({
      where: { id },
      relations: ['country', 'category'],
    });

    if (!restaurant) throw new NotFoundException('Restaurant not found');

    if (dto.name) restaurant.name = dto.name;
    if (dto.location) restaurant.location = dto.location;
    if (dto.description) restaurant.description = dto.description;
    if (dto.workingHours) restaurant.workingHours = dto.workingHours;
    if (dto.latitude !== undefined) restaurant.latitude = dto.latitude;
    if (dto.longitude !== undefined) restaurant.longitude = dto.longitude;

    if (dto.countryId) {
      const country = await this.countryRepo.findOne({
        where: { id: dto.countryId },
      });
      if (!country) throw new NotFoundException('Country not found');
      restaurant.country = country;
    }

    if (dto.categoryId) {
      const category = await this.categoryRepo.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) throw new NotFoundException('Category not found');
      restaurant.category = category;
    }

    // ✅ رفع الصورة الرئيسية لو تم رفع ملف
    if (mainImageFile) {
      const result = await this.cloudinaryService.uploadImage(
        mainImageFile,
        'restaurants',
      );
      restaurant.mainImage = result.secure_url;
    }

    // صورة اللوغو
    if (logoFile) {
      const result = await this.cloudinaryService.uploadImage(
        logoFile,
        'restaurants/logo',
      );
      restaurant.logo_url = result.secure_url;
    }

    return this.restaurantRepo.save(restaurant);
  }

  async remove(id: string, type: BusinessType): Promise<void> {
    const restaurant = await this.restaurantRepo.findOne({
      where: { id, type },
    });
    if (!restaurant) throw new NotFoundException(`${type} not found`);
    await this.restaurantRepo.remove(restaurant);
  }

  async findAllSortedByRating(
    type: BusinessType,
    order: 'ASC' | 'DESC' = 'DESC',
  ) {
    const restaurants = await this.restaurantRepo.find({
      where: { type },
      order: { averageRating: order },
      relations: ['meals', 'owner', 'category'],
      select: {
        id: true,
        name: true,
        location: true,
        Identity: true,
        logo_url: true,
        category: { id: true },
        averageRating: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          id: true,
          userType: true,
          firstName: true,
          lastName: true,
          email: true, // ✅ أضفناها
        },
      },
    });

    return restaurants.map((r) => ({
      ...r,
      owner: this.mapOwner(r.owner),
    }));
  }

  async getRestaurantProfile(id: string, type: BusinessType) {
    const restaurant = await this.restaurantRepo.findOne({
      where: { id, type },
      relations: ['country', 'category'],
    });

    if (!restaurant) throw new NotFoundException(`${type} not found`);

    return {
      id: restaurant.id,
      name: restaurant.name,
      description: restaurant.description,
      logoUrl: restaurant.logo_url,
      mainImage: restaurant.mainImage,
      workingHours: restaurant.workingHours,
      country: restaurant.country
        ? {
            id: restaurant.country.id,
            name: restaurant.country.name,
            image: restaurant.country.logoImage, // لازم يكون عندك عمود image في country
          }
        : null,
      categories: restaurant.category
        ? {
            id: restaurant.category.id,
            name: restaurant.category.name,
            image: restaurant.category.image_url, // لازم يكون عندك عمود image في category
          }
        : null,
    };
  }

  async getRestaurantUpperProfile(
    restaurantId: string,
    type: BusinessType,
    userId?: string,
  ): Promise<RestaurantProfileDto> {
    const restaurant = await this.restaurantRepo.findOne({
      where: { id: restaurantId, type },
    });

    if (!restaurant) throw new NotFoundException(`${type} not found`);

    // عدد المتابعين
    const followersCount = await this.followRepo.count({
      where: { restaurant: { id: restaurantId } },
    });
    // هل المستخدم الحالي متابع
    const isFollowed: boolean = userId
      ? await this.followRepo.exist({
          where: { restaurant: { id: restaurantId }, user: { id: userId } },
        })
      : false;

    return {
      id: restaurant.id,
      name: restaurant.name,
      profileImage: restaurant.logo_url,
      rating: restaurant.averageRating,
      followersCount,
      isFollowed,
    };
  }

  async getRestaurantReviews(restaurantId: string, type: BusinessType) {
    const restaurant = await this.restaurantRepo.findOne({
      where: { id: restaurantId, type },
      select: ['id', 'name', 'averageRating'],
    });

    if (!restaurant) throw new NotFoundException(`${type} not found`);

    const ratings = await this.ratingRepo.find({
      where: { restaurant: { id: restaurantId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    return {
      avgRating: restaurant.averageRating,
      totalReviewers: ratings.length,
      reviews: ratings.map((rating) => ({
        id: rating.id,
        score: rating.score,
        comment: rating.comment,
        createdAt: rating.createdAt,
        user: rating.user
          ? {
              id: rating.user.id,
              name: rating.user.firstName,
              profile_picture: rating.user.profile_picture ?? null,
            }
          : null,
      })),
    };
  }

  async getRestaurantDishes(
    restaurantId: string,
    type: 'restaurant' | 'store',
    categoryId?: string,
  ) {
    const query = this.mealRepo
      .createQueryBuilder('meal')
      .leftJoinAndSelect('meal.restaurant', 'restaurant')
      .leftJoinAndSelect('meal.category', 'category')
      .where('meal.restaurantId = :restaurantId', { restaurantId })
      .andWhere('restaurant.type = :type', { type });

    if (categoryId) {
      query.andWhere('meal.categoryId = :categoryId', { categoryId });
    }
    const meals = await query.getMany();

    return { meals };
  }

  async getImages(restaurantId: string, type: BusinessType) {
    const restaurant = await this.restaurantRepo.findOne({
      where: { id: restaurantId, type },
      relations: ['images'],
    });
    if (!restaurant) throw new NotFoundException(`${type} not found`);
    return { images: restaurant.images };
  }

  async addImage(
    restaurantId: string,
    type: BusinessType,
    userId: string,
    file: Express.Multer.File,
  ) {
    const restaurant = await this.restaurantRepo.findOne({
      where: { id: restaurantId, type },
      relations: ['owner'],
    });
    if (!restaurant) throw new NotFoundException(`${type} not found`);
    if (restaurant.owner.id !== userId)
      throw new ForbiddenException('Not allowed');

    const uploadResult = await this.cloudinaryService.uploadImage(
      file,
      `${restaurant.type}s/images`,
    );
    const newImage = this.imageRepo.create({
      url: uploadResult.secure_url,
      restaurant,
    });
    return this.imageRepo.save(newImage);
  }

  async deleteImage(
    imageId: string,
    type: 'restaurant' | 'store',
    userId: string,
  ) {
    const image = await this.imageRepo.findOne({
      where: { id: imageId },
      relations: ['restaurant', 'restaurant.owner'],
    });
    if (!image || image.restaurant.type !== type)
      throw new NotFoundException(`${type} image not found`);
    if (image.restaurant.owner.id !== userId)
      throw new ForbiddenException('Not allowed');

    await this.imageRepo.delete(imageId);
    return { success: true };
  }

  async getVideos(restaurantId: string, type: BusinessType) {
    const restaurant = await this.restaurantRepo.findOne({
      where: { id: restaurantId, type },
      relations: ['videos'],
    });
    if (!restaurant) throw new NotFoundException(`${type} not found`);
    return { videos: restaurant.videos };
  }

  async addVideo(
    restaurantId: string,
    type: BusinessType,
    userId: string,
    file: Express.Multer.File,
  ) {
    const restaurant = await this.restaurantRepo.findOne({
      where: { id: restaurantId, type },
      relations: ['owner'],
    });
    if (!restaurant) throw new NotFoundException(`${type} not found`);
    if (restaurant.owner.id !== userId)
      throw new ForbiddenException('Not allowed');

    const uploadResult = await this.cloudinaryService.uploadVideo(
      file,
      `${restaurant.type}s/videos`,
    );
    const thumbnailUrl = this.cloudinaryService.generateThumbnail(
      uploadResult.public_id,
    );

    const newVideo = this.videoRepo.create({
      videoUrl: uploadResult.secure_url,
      thumbnailUrl,
      restaurant,
    });
    return this.videoRepo.save(newVideo);
  }

  async deleteVideo(
    videoId: string,
    type: 'restaurant' | 'store',
    userId: string,
  ) {
    const video = await this.videoRepo.findOne({
      where: { id: videoId },
      relations: ['restaurant', 'restaurant.owner'],
    });
    if (!video || video.restaurant.type !== type)
      throw new NotFoundException(`${type} video not found`);
    if (video.restaurant.owner.id !== userId)
      throw new ForbiddenException('Not allowed');

    await this.videoRepo.delete(videoId);
    return { success: true };
  }
  async addDeliveryLocation(
    restaurantId: string,
    dto: Partial<DeliveryLocation>,
    userId: string,
  ): Promise<DeliveryLocation> {
    const restaurant = await this.restaurantRepo.findOne({
      where: { id: restaurantId },
      relations: ['owner'],
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    if (restaurant.owner.id !== userId) {
      throw new ForbiddenException('Only the owner can add delivery locations');
    }
    const location = this.deliveryLocationRepo.create({ ...dto, restaurant });
    return this.deliveryLocationRepo.save(location);
  }

  async deleteDeliveryLocation(id: string, userId: string): Promise<void> {
    const location = await this.deliveryLocationRepo.findOne({
      where: { id },
      relations: ['restaurant', 'restaurant.owner'],
    });
    if (!location) throw new NotFoundException('Delivery location not found');
    if (location.restaurant.owner.id !== userId) {
      throw new ForbiddenException(
        'Only the owner can delete delivery locations',
      );
    }
    await this.deliveryLocationRepo.delete(id);
  }

  async getDeliveryLocations(
    restaurantId: string,
  ): Promise<DeliveryLocation[]> {
    return this.deliveryLocationRepo.find({
      where: { restaurant: { id: restaurantId } },
    });
  }
}
