/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Category } from '../category/category.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly jwtService: JwtService,
  ) {}

  // تسجيل مستخدم جديد
  async create(createUserDto: CreateUserDto) {
    // تحقق من تطابق الباسورد
    if (createUserDto.password !== createUserDto.confirmPassword) {
      throw new HttpException('Passwords do not match', HttpStatus.BAD_REQUEST);
    }

    // تحقق من الأكلة المفضلة إذا كانت موجودة
    let favoriteCategory: Category | null = null;
    if (createUserDto.favoriteFood) {
      favoriteCategory = await this.categoryRepository.findOne({
        where: { id: createUserDto.favoriteFood },
      });

      if (!favoriteCategory) {
        throw new HttpException(
          'Favorite food category not found',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // إنشاء مستخدم
    const user = this.userRepository.create({
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      birthDate: createUserDto.birthDate,
      gender: createUserDto.gender,
      email: createUserDto.email,
      password: hashedPassword,
      profile_picture: createUserDto.profile_picture,
      userType: createUserDto.userType || 'normalUser',
      favoriteFood: favoriteCategory ?? undefined,
    });
    console.log('DTO userType:', createUserDto.userType);

    const savedUser = await this.userRepository.save(user);
    console.log('Saved userType:', savedUser.userType);

    // إنشاء توكن JWT
    const payload = {
      id: savedUser.id,
      email: savedUser.email,
      userType: savedUser.userType,
    };
    const accessToken = this.jwtService.sign(payload);

    return { user: savedUser, accessToken };
  }

  // إحضار مستخدم حسب ID
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['favoriteFood'],
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['favoriteFood'], // إذا بدك تجيب الأكلة المفضلة كمان
    });
  }

  // إحضار مستخدم حسب Email
  async findByEmail(email: string) {
    return await this.userRepository.findOne({ where: { email } });
  }

  // تحديث بيانات مستخدم
  async update(id: string, updateData: Partial<CreateUserDto>): Promise<User> {
    const user = await this.findById(id);

    if (updateData.password && updateData.confirmPassword) {
      if (updateData.password !== updateData.confirmPassword) {
        throw new HttpException(
          'Passwords do not match',
          HttpStatus.BAD_REQUEST,
        );
      }
      user.password = await bcrypt.hash(updateData.password, 10);
    }

    if (updateData.favoriteFood) {
      const favoriteCategory = await this.categoryRepository.findOne({
        where: { id: updateData.favoriteFood },
      });

      if (!favoriteCategory) {
        throw new HttpException(
          'Favorite food category not found',
          HttpStatus.BAD_REQUEST,
        );
      }

      user.favoriteFood = favoriteCategory;
    }

    Object.assign(user, updateData);

    return await this.userRepository.save(user);
  }

  // حذف مستخدم
  async remove(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
  }
}
