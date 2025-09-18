import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1758161738815 implements MigrationInterface {
    name = 'Initial1758161738815'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_0e33434a2d18c89a149c8ad6d86"`);
        await queryRunner.query(`CREATE TYPE "public"."post_reactions_type_enum" AS ENUM('like', 'love', 'fire')`);
        await queryRunner.query(`CREATE TABLE "post_reactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."post_reactions_type_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "postId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "UQ_452ad3c5abe99f67a3b482f65e4" UNIQUE ("userId", "postId"), CONSTRAINT "PK_6decd1418b8f35995281eaa6e09" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."reaction_type_enum" AS ENUM('like', 'love', 'fire')`);
        await queryRunner.query(`CREATE TABLE "reaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."reaction_type_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "storyId" uuid, "userId" uuid, CONSTRAINT "PK_41fbb346da22da4df129f14b11e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "story" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "text" character varying, "mediaUrl" character varying, "thumbnailUrl" character varying, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "restaurantId" uuid, CONSTRAINT "PK_28fce6873d61e2cace70a0f3361" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "ownerId"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "content"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "text" text`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "thumbnailUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "mediaUrl"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "mediaUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "post_reactions" ADD CONSTRAINT "FK_b8f6756d160de241ea96a768254" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_reactions" ADD CONSTRAINT "FK_d7d9db2320c356f8d32eae9d752" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reaction" ADD CONSTRAINT "FK_75ebcf43a1c24dca3df1c4b4d7d" FOREIGN KEY ("storyId") REFERENCES "story"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reaction" ADD CONSTRAINT "FK_e58a09ab17e3ce4c47a1a330ae1" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "story" ADD CONSTRAINT "FK_82c7f5bfd8cc7ff86f5f3abf69a" FOREIGN KEY ("restaurantId") REFERENCES "restaurant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "story" DROP CONSTRAINT "FK_82c7f5bfd8cc7ff86f5f3abf69a"`);
        await queryRunner.query(`ALTER TABLE "reaction" DROP CONSTRAINT "FK_e58a09ab17e3ce4c47a1a330ae1"`);
        await queryRunner.query(`ALTER TABLE "reaction" DROP CONSTRAINT "FK_75ebcf43a1c24dca3df1c4b4d7d"`);
        await queryRunner.query(`ALTER TABLE "post_reactions" DROP CONSTRAINT "FK_d7d9db2320c356f8d32eae9d752"`);
        await queryRunner.query(`ALTER TABLE "post_reactions" DROP CONSTRAINT "FK_b8f6756d160de241ea96a768254"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "mediaUrl"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "mediaUrl" text`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "thumbnailUrl"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "text"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "content" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "ownerId" uuid`);
        await queryRunner.query(`DROP TABLE "story"`);
        await queryRunner.query(`DROP TABLE "reaction"`);
        await queryRunner.query(`DROP TYPE "public"."reaction_type_enum"`);
        await queryRunner.query(`DROP TABLE "post_reactions"`);
        await queryRunner.query(`DROP TYPE "public"."post_reactions_type_enum"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_0e33434a2d18c89a149c8ad6d86" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
