// import { User } from '../src/user/user.entity';
// import { Category } from '../src/category/category.entity';
// import { Video } from '../src/cloudinary.video/VideoEntity';
import { config } from 'dotenv';
import { resolve } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
// import { Restaurant } from '../src/restaurant/restaurant.entity';
// import { Meal } from '../src/meal/meal.entity';
// import { Cart } from '../src/cart/cart.entity';
// import { Order } from '../src/order/order.entity';
// import { CartItem } from '../src/cart/cart-item.entity';
// import { OrderItem } from '../src/order/order-item.entity';
// import { Rating } from '../src/rating/rating.entity';
// import { Reaction } from '../src/story/reaction.entity';
// import { Post } from '../src/post/post.entity';
// import { Country } from '../src/country/county.entity';
// import { Follow } from '../src/follow/follow.entity';
// import { Like } from '../src/like/like.entity';
// import { RatingReply } from '../src/rating/rating-reply.entity';
// import { RestaurantImage } from '../src/restaurant/restaurant-image.entity';
// import { RestaurantVideo } from '../src/restaurant/restaurant-video.entity';
// import { Story } from '../src/story/story.entity';
// import { PostReaction } from '../src/post/post-reaction.entity';
// import { DeliveryLocation } from '../src/restaurant/delivery-location.entity';

// Load env from project root first; if missing (e.g., file accidentally in src/), try src/.env
config({ path: resolve(process.cwd(), '.env') });
if (!process.env.DATABASE_URL) {
  config({ path: resolve(process.cwd(), 'src/.env') });
}

// Prefer DATABASE_URL from env; keep it a string to satisfy strict TS
const DB_URL: string = String(process.env.DATABASE_URL ?? '');
if (!DB_URL) {
  // Helpful diagnostic to avoid confusing "password must be a string" from pg
  console.warn(
    '[DB] DATABASE_URL is empty. Ensure .env is at project root and contains a valid URL.',
  );
}

// If sslmode is required or DB_SSL=true, enable SSL with relaxed CA (common for cloud Postgres)
const NEED_SSL: boolean =
  /sslmode=require/i.test(DB_URL || '') ||
  /^true$/i.test(process.env.DB_SSL ?? '');

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  // NOTE: url must be a string; if empty, TypeORM will throw at runtime with a clear message
  url: DB_URL,
  ssl: NEED_SSL ? { rejectUnauthorized: false } : undefined,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true,
  migrations: ['dist/db/migrations/*.js'],
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
