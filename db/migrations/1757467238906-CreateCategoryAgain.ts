/* eslint-disable prettier/prettier */
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCategoryAgain1757467238906 implements MigrationInterface {
    name = 'CreateCategoryAgain1757467238906'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "category" ("category_id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying NOT NULL, "image_url" character varying, "userUserId" integer, CONSTRAINT "PK_cc7f32b7ab33c70b9e715afae84" PRIMARY KEY ("category_id"))`);
        await queryRunner.query(`ALTER TABLE "category" ADD CONSTRAINT "FK_2888b307daef085d2a131703fd1" FOREIGN KEY ("userUserId") REFERENCES "user"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post" ADD CONSTRAINT "FK_94a66f51626e0aabac149263709" FOREIGN KEY ("categoryCategoryId") REFERENCES "category"("category_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post" DROP CONSTRAINT "FK_94a66f51626e0aabac149263709"`);
        await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "FK_2888b307daef085d2a131703fd1"`);
        await queryRunner.query(`DROP TABLE "category"`);
    }

}
