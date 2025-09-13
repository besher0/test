import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1757770308585 implements MigrationInterface {
    name = 'Initial1757770308585'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "meal" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "price" numeric(10,2) NOT NULL, "image_url" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "restaurantId" uuid, "categoryId" uuid, CONSTRAINT "PK_ada510a5aba19e6bb500f8f7817" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rating" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "value" integer NOT NULL DEFAULT '1', "userId" uuid, "restaurantId" uuid, CONSTRAINT "PK_ecda8ad32645327e4765b43649e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "restaurant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "location" character varying, "Identity" character varying, "logo_url" character varying, "averageRating" double precision NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "ownerId" uuid, "categoryId" uuid, CONSTRAINT "PK_649e250d8b8165cb406d99aa30f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cart_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quantity" integer NOT NULL DEFAULT '1', "cartId" uuid, "mealId" uuid, CONSTRAINT "PK_bd94725aa84f8cf37632bcde997" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cart" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid, CONSTRAINT "REL_756f53ab9466eb52a52619ee01" UNIQUE ("userId"), CONSTRAINT "PK_c524ec48751b9b5bcfbf6e59be7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quantity" integer NOT NULL, "price" numeric(10,2) NOT NULL, "mealId" uuid, "orderId" uuid, CONSTRAINT "PK_d01158fe15b1ead5c26fd7f4e90" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."order_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELED')`);
        await queryRunner.query(`CREATE TABLE "order" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "totalPrice" numeric(10,2) NOT NULL DEFAULT '0', "status" "public"."order_status_enum" NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_1031171c13130102495201e3e20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" character varying NOT NULL, "imageUrl" character varying, "videoUrl" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "ownerId" uuid, CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."reactions_type_enum" AS ENUM('like', 'love', 'fire')`);
        await queryRunner.query(`CREATE TABLE "reactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."reactions_type_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "postId" uuid, CONSTRAINT "UQ_f275470c11fae3a72b7ce334b36" UNIQUE ("userId", "postId"), CONSTRAINT "PK_0b213d460d0c473bc2fb6ee27f3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_usertype_enum" AS ENUM('normalUser', 'admin', 'restaurant', 'store')`);
        await queryRunner.query(`CREATE TYPE "public"."user_gender_enum" AS ENUM('male', 'female')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "birthDate" date NOT NULL, "favoriteFood" character varying, "userType" "public"."user_usertype_enum" NOT NULL DEFAULT 'normalUser', "gender" "public"."user_gender_enum" NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "profile_picture" character varying, "cartId" uuid, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "REL_342497b574edb2309ec8c6b62a" UNIQUE ("cartId"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying NOT NULL, "image_url" character varying, "userId" uuid, CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "video" ("id" SERIAL NOT NULL, "url" character varying NOT NULL, "publicId" character varying, "duration" integer, "userId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1a2f3856250765d72e7e1636c8e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "meal" ADD CONSTRAINT "FK_1edadecc84f4c99bca5f9256222" FOREIGN KEY ("restaurantId") REFERENCES "restaurant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "meal" ADD CONSTRAINT "FK_fdd43ea916c49f9f38f4d72575c" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rating" ADD CONSTRAINT "FK_a6c53dfc89ba3188b389ef29a62" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rating" ADD CONSTRAINT "FK_460ba90243fec8a02467bc96282" FOREIGN KEY ("restaurantId") REFERENCES "restaurant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "restaurant" ADD CONSTRAINT "FK_315af20ce2dd3e52d28fba79fab" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "restaurant" ADD CONSTRAINT "FK_735a127e301c95ee77eb7ff83f1" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cart_item" ADD CONSTRAINT "FK_29e590514f9941296f3a2440d39" FOREIGN KEY ("cartId") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cart_item" ADD CONSTRAINT "FK_ed4967463480c48d20577780722" FOREIGN KEY ("mealId") REFERENCES "meal"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cart" ADD CONSTRAINT "FK_756f53ab9466eb52a52619ee019" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_item" ADD CONSTRAINT "FK_636f68b266c8978c3bb0f91d428" FOREIGN KEY ("mealId") REFERENCES "meal"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_item" ADD CONSTRAINT "FK_646bf9ece6f45dbe41c203e06e0" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_caabe91507b3379c7ba73637b84" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_0e33434a2d18c89a149c8ad6d86" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reactions" ADD CONSTRAINT "FK_f3e1d278edeb2c19a2ddad83f8e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reactions" ADD CONSTRAINT "FK_d9628397382a90981e26a915bc9" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_342497b574edb2309ec8c6b62aa" FOREIGN KEY ("cartId") REFERENCES "cart"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_13e8b2a21988bec6fdcbb1fa741" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_13e8b2a21988bec6fdcbb1fa741"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_342497b574edb2309ec8c6b62aa"`);
        await queryRunner.query(`ALTER TABLE "reactions" DROP CONSTRAINT "FK_d9628397382a90981e26a915bc9"`);
        await queryRunner.query(`ALTER TABLE "reactions" DROP CONSTRAINT "FK_f3e1d278edeb2c19a2ddad83f8e"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_0e33434a2d18c89a149c8ad6d86"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_caabe91507b3379c7ba73637b84"`);
        await queryRunner.query(`ALTER TABLE "order_item" DROP CONSTRAINT "FK_646bf9ece6f45dbe41c203e06e0"`);
        await queryRunner.query(`ALTER TABLE "order_item" DROP CONSTRAINT "FK_636f68b266c8978c3bb0f91d428"`);
        await queryRunner.query(`ALTER TABLE "cart" DROP CONSTRAINT "FK_756f53ab9466eb52a52619ee019"`);
        await queryRunner.query(`ALTER TABLE "cart_item" DROP CONSTRAINT "FK_ed4967463480c48d20577780722"`);
        await queryRunner.query(`ALTER TABLE "cart_item" DROP CONSTRAINT "FK_29e590514f9941296f3a2440d39"`);
        await queryRunner.query(`ALTER TABLE "restaurant" DROP CONSTRAINT "FK_735a127e301c95ee77eb7ff83f1"`);
        await queryRunner.query(`ALTER TABLE "restaurant" DROP CONSTRAINT "FK_315af20ce2dd3e52d28fba79fab"`);
        await queryRunner.query(`ALTER TABLE "rating" DROP CONSTRAINT "FK_460ba90243fec8a02467bc96282"`);
        await queryRunner.query(`ALTER TABLE "rating" DROP CONSTRAINT "FK_a6c53dfc89ba3188b389ef29a62"`);
        await queryRunner.query(`ALTER TABLE "meal" DROP CONSTRAINT "FK_fdd43ea916c49f9f38f4d72575c"`);
        await queryRunner.query(`ALTER TABLE "meal" DROP CONSTRAINT "FK_1edadecc84f4c99bca5f9256222"`);
        await queryRunner.query(`DROP TABLE "video"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_gender_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_usertype_enum"`);
        await queryRunner.query(`DROP TABLE "reactions"`);
        await queryRunner.query(`DROP TYPE "public"."reactions_type_enum"`);
        await queryRunner.query(`DROP TABLE "posts"`);
        await queryRunner.query(`DROP TABLE "order"`);
        await queryRunner.query(`DROP TYPE "public"."order_status_enum"`);
        await queryRunner.query(`DROP TABLE "order_item"`);
        await queryRunner.query(`DROP TABLE "cart"`);
        await queryRunner.query(`DROP TABLE "cart_item"`);
        await queryRunner.query(`DROP TABLE "restaurant"`);
        await queryRunner.query(`DROP TABLE "rating"`);
        await queryRunner.query(`DROP TABLE "meal"`);
    }

}
