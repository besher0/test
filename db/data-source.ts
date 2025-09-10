/* eslint-disable prettier/prettier */

import { Category } from 'src/category/category.entity';
import { Video } from 'src/cloudinary.video/VideoEntity';

import { User } from 'src/user/user.entity';
import { UserPreferences } from 'src/user-preferences/user-preferences.entity';
import { config } from "dotenv";
import { DataSource, DataSourceOptions } from 'typeorm';

/* eslint-disable prettier/prettier */
config({ path: '.env' });

// data source options
export const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    url: 'postgresql://neondb_owner:npg_B3SD1CtAOyMq@ep-gentle-violet-a7rfsa0h-pooler.ap-southeast-2.aws.neon.tech/from-house1?sslmode=require&channel_binding=require',
    entities: [User,Category,Video,UserPreferences,],
     synchronize: false,
    migrations: ["dist/db/migrations/*.js"]
}

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;