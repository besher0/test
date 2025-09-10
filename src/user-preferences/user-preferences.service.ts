/* eslint-disable prettier/prettier */
import {  Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { UserPreferences } from '../user-preferences/user-preferences.entity';
import { CreateUserPreferencesDto } from '../user-preferences/dto/create-user-preferences.dto';
import { UpdateUserPreferencesDto } from '../user-preferences/dto/update-user-preferences.dto';
// import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class UserPreferencesService {
  constructor(
    @InjectRepository(UserPreferences)
    private userPreferencesRepository: Repository<UserPreferences>,
    // private cloudinaryService: CloudinaryService,
  ) {}

  async create(createUserPreferencesDto: CreateUserPreferencesDto): Promise<UserPreferences> {
    const preference = this.userPreferencesRepository.create(createUserPreferencesDto);
    return this.userPreferencesRepository.save(preference);
  }

  async findAll(): Promise<UserPreferences[]> {
    return this.userPreferencesRepository.find();
  }

async findOne(options: FindOneOptions<UserPreferences>): Promise<UserPreferences | null> {
  return this.userPreferencesRepository.findOne(options);
}

async update(id: number, updateUserPreferencesDto: UpdateUserPreferencesDto): Promise<UserPreferences | null> {
  await this.userPreferencesRepository.update(id, updateUserPreferencesDto);
  return this.findOne({ where: { preference_id: id } });
}


  async remove(id: number): Promise<void> {
    await this.userPreferencesRepository.delete(id);
  }

  async deleteByUserId(userId: number): Promise<void> {
  await this.userPreferencesRepository.delete({ user: { user_id: userId } });
}



  
}