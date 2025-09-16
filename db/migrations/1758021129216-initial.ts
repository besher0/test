import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1758021129216 implements MigrationInterface {
    name = 'Initial1758021129216'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "restaurant_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" character varying NOT NULL, "restaurantId" uuid, CONSTRAINT "PK_ade2661d352ff566cd33277fc4d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "restaurant_videos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "videoUrl" character varying NOT NULL, "thumbnailUrl" character varying NOT NULL, "restaurantId" uuid, CONSTRAINT "PK_767ad47db9f5ad5d6490908503b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "restaurant_images" ADD CONSTRAINT "FK_40df567b4886a00b40b0a4a10a0" FOREIGN KEY ("restaurantId") REFERENCES "restaurant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "restaurant_videos" ADD CONSTRAINT "FK_97513009cbce6e14df35e3ae906" FOREIGN KEY ("restaurantId") REFERENCES "restaurant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant_videos" DROP CONSTRAINT "FK_97513009cbce6e14df35e3ae906"`);
        await queryRunner.query(`ALTER TABLE "restaurant_images" DROP CONSTRAINT "FK_40df567b4886a00b40b0a4a10a0"`);
        await queryRunner.query(`DROP TABLE "restaurant_videos"`);
        await queryRunner.query(`DROP TABLE "restaurant_images"`);
    }

}
