/* eslint-disable prettier/prettier */
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from '../user/user.entity';
import { UserPreferencesModule } from 'src/user-preferences/user-preferences.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]),UserPreferencesModule,forwardRef(() => AuthModule),],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}