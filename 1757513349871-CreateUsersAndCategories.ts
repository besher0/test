import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersAndCategories1757513349871 implements MigrationInterface {
    name = 'CreateUsersAndCategories1757513349871'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_preferences" ("preference_id" SERIAL NOT NULL, "preference_type" character varying NOT NULL, "preference_value" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "userUserId" integer, CONSTRAINT "PK_ef24a54eeefc908d7a6af387e42" PRIMARY KEY ("preference_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_usertype_enum" AS ENUM('normalUser', 'admin', 'restaurant', 'store')`);
        await queryRunner.query(`CREATE TYPE "public"."users_gender_enum" AS ENUM('male', 'female')`);
        await queryRunner.query(`CREATE TABLE "users" ("user_id" SERIAL NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "birthDate" date NOT NULL, "favoriteFood" character varying, "userType" "public"."users_usertype_enum" NOT NULL DEFAULT 'normalUser', "gender" "public"."users_gender_enum" NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "Identity" character varying NOT NULL, "country" character varying NOT NULL, "profile_picture" character varying, "bio" character varying, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_96aac72f1574b88752e9fb00089" PRIMARY KEY ("user_id"))`);
        await queryRunner.query(`CREATE TABLE "categories" ("category_id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying NOT NULL, "image_url" character varying, "userUserId" integer, CONSTRAINT "PK_51615bef2cea22812d0dcab6e18" PRIMARY KEY ("category_id"))`);
        await queryRunner.query(`CREATE TABLE "video" ("id" SERIAL NOT NULL, "url" character varying NOT NULL, "publicId" character varying, "duration" integer, "userId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1a2f3856250765d72e7e1636c8e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_preferences" ADD CONSTRAINT "FK_5a21f4e8ac6acd4003b0b127578" FOREIGN KEY ("userUserId") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_64f218a58a04de781e7236881b8" FOREIGN KEY ("userUserId") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_64f218a58a04de781e7236881b8"`);
        await queryRunner.query(`ALTER TABLE "user_preferences" DROP CONSTRAINT "FK_5a21f4e8ac6acd4003b0b127578"`);
        await queryRunner.query(`DROP TABLE "video"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_gender_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_usertype_enum"`);
        await queryRunner.query(`DROP TABLE "user_preferences"`);
    }

}
