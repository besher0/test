/* eslint-disable prettier/prettier */
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { Category } from '../category/category.entity';
import { UserPreferencesModule } from 'src/user-preferences/user-preferences.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([Category, ]),CloudinaryModule,forwardRef(() => UserPreferencesModule)],
  controllers: [CategoryController],
  providers: [CategoryService],
    exports: [CategoryService,],

})
export class CategoryModule {}