/* eslint-disable prettier/prettier */
import {  Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { Category } from '../category/category.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([Category, ]),CloudinaryModule],
  controllers: [CategoryController],
  providers: [CategoryService],
    exports: [CategoryService,],

})
export class CategoryModule {}