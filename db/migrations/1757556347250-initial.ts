import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1757556347250 implements MigrationInterface {
    name = 'Initial1757556347250'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_64f218a58a04de781e7236881b8"`);
        await queryRunner.query(`CREATE TABLE "meal" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "price" numeric(10,2) NOT NULL, "image_url" character varying, "isAvailable" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "restaurantId" uuid, "categoryId" uuid, CONSTRAINT "PK_ada510a5aba19e6bb500f8f7817" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "restaurant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "location" character varying, "Identity" character varying, "logo_url" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "ownerId" uuid, "categoryId" uuid, CONSTRAINT "PK_649e250d8b8165cb406d99aa30f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_usertype_enum" AS ENUM('normalUser', 'admin', 'restaurant', 'store')`);
        await queryRunner.query(`CREATE TYPE "public"."user_gender_enum" AS ENUM('male', 'female')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "birthDate" date NOT NULL, "favoriteFood" character varying, "userType" "public"."user_usertype_enum" NOT NULL DEFAULT 'normalUser', "gender" "public"."user_gender_enum" NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "profile_picture" character varying, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "PK_51615bef2cea22812d0dcab6e18"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "category_id"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "userUserId"`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "meal" ADD CONSTRAINT "FK_1edadecc84f4c99bca5f9256222" FOREIGN KEY ("restaurantId") REFERENCES "restaurant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "meal" ADD CONSTRAINT "FK_fdd43ea916c49f9f38f4d72575c" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "restaurant" ADD CONSTRAINT "FK_315af20ce2dd3e52d28fba79fab" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "restaurant" ADD CONSTRAINT "FK_735a127e301c95ee77eb7ff83f1" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_13e8b2a21988bec6fdcbb1fa741" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_13e8b2a21988bec6fdcbb1fa741"`);
        await queryRunner.query(`ALTER TABLE "restaurant" DROP CONSTRAINT "FK_735a127e301c95ee77eb7ff83f1"`);
        await queryRunner.query(`ALTER TABLE "restaurant" DROP CONSTRAINT "FK_315af20ce2dd3e52d28fba79fab"`);
        await queryRunner.query(`ALTER TABLE "meal" DROP CONSTRAINT "FK_fdd43ea916c49f9f38f4d72575c"`);
        await queryRunner.query(`ALTER TABLE "meal" DROP CONSTRAINT "FK_1edadecc84f4c99bca5f9256222"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "userUserId" integer`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "category_id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "PK_51615bef2cea22812d0dcab6e18" PRIMARY KEY ("category_id")`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_gender_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_usertype_enum"`);
        await queryRunner.query(`DROP TABLE "restaurant"`);
        await queryRunner.query(`DROP TABLE "meal"`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_64f218a58a04de781e7236881b8" FOREIGN KEY ("userUserId") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
