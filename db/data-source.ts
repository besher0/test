/* eslint-disable prettier/prettier */

import { Category } from 'src/category/category.entity';
import { Video } from 'src/cloudinary.video/VideoEntity';

import { User } from 'src/user/user.entity';
import { config } from "dotenv";
import { DataSource, DataSourceOptions } from 'typeorm';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { Meal } from 'src/meal/meal.entity';
import { Cart } from 'src/cart/cart.entity';
import { Order } from 'src/order/order.entity';
import { CartItem } from 'src/cart/cart-item.entity';
import { OrderItem } from 'src/order/order-item.entity';
import { Rating } from 'src/rating/rating.entity';
import { Reaction } from 'src/reaction/reaction.entity';
import { Post } from 'src/post/post.entity';
import { Country } from 'src/country/county.entity';

/* eslint-disable prettier/prettier */
config({ path: '.env' });

// data source options
export const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    url: 'postgresql://neondb_owner:npg_B3SD1CtAOyMq@ep-gentle-violet-a7rfsa0h-pooler.ap-southeast-2.aws.neon.tech/from-house1?sslmode=require&channel_binding=require',
    entities: [User,Category,Video,Restaurant,Meal,Cart,Order,CartItem,OrderItem,Rating,Reaction,Post,Country],
     synchronize: false,
    migrations: ["dist/db/migrations/*.js"]
}

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;