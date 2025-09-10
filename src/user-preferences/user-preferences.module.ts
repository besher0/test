/* eslint-disable prettier/prettier */
import {  forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPreferencesController } from './user-preferences.controller';
import { UserPreferencesService } from './user-preferences.service';
import { UserPreferences } from '../user-preferences/user-preferences.entity';

import { CategoryModule } from 'src/category/category.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserPreferences,]),
  forwardRef(() => CategoryModule), 
  CloudinaryModule],
  controllers: [UserPreferencesController],
  providers: [UserPreferencesService,],
  exports: [UserPreferencesService],

})
export class UserPreferencesModule {}