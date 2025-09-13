/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
        private jwtService: JwtService,
    
  ) {}

  async create(createUserDto: CreateUserDto): Promise<{ user: User; accessToken: string }> {
    if (createUserDto.password !== createUserDto.confirmPassword) {
      throw new Error('Passwords do not match');
    }
    const userType = createUserDto.userType || 'normalUser';
  if (userType === 'normalUser' && !createUserDto.favoriteFood) {
    throw new HttpException('Favorite food is required for normal users', HttpStatus.BAD_REQUEST);
  }

  // تحقق يدوي من قيمة favoriteFood إذا كانت موجودة
  const validFoods = ['لحمة', 'رز', 'مشروبات', 'حلويات', 'برغر', 'معكرونة'];
  if (createUserDto.favoriteFood && !validFoods.includes(createUserDto.favoriteFood)) {
    throw new HttpException('Favorite food must be one of the listed options', HttpStatus.BAD_REQUEST);
  }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      userType: createUserDto.userType || 'normalUser',
      
    });

    const savedUser = await this.userRepository.save(user);

if (savedUser.userType === 'normalUser' && createUserDto.favoriteFood) {
      savedUser.favoriteFood=createUserDto.favoriteFood
    }
  const payload = { id: savedUser.id, email: savedUser.email, userType: savedUser.userType };
  const accessToken = await this.jwtService.signAsync(payload);

  return {
    user: savedUser,
    accessToken:accessToken,
  };

  }

async findAll(): Promise<User[]> {
  return this.userRepository.find(); 
}

  async findOne(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: id } });
  }

  async findOneByEmail(email: string): Promise<User> {
    return this.userRepository.findOneOrFail({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    
const user = await this.findOne(id);
  if (!user) {
    throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  }
  if (updateUserDto.password && updateUserDto.password !== updateUserDto.confirmPassword) {
    throw new HttpException('Passwords do not match', HttpStatus.BAD_REQUEST);}

    const hashedPassword = updateUserDto.password ? await bcrypt.hash(updateUserDto.password, 10) : undefined;
    await this.userRepository.update(id, {
      ...updateUserDto,
      password: hashedPassword,
    });
    return this.findOne(id);
  }
  

  async remove(id: string): Promise<void> {

    await this.userRepository.delete(id);
  }
}