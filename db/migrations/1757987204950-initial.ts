import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1757987204950 implements MigrationInterface {
    name = 'Initial1757987204950'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant" ADD "mainImage" character varying`);
        await queryRunner.query(`ALTER TABLE "restaurant" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "restaurant" ADD "workingHours" character varying`);
        await queryRunner.query(`ALTER TABLE "restaurant" ADD "countryId" uuid`);
        await queryRunner.query(`ALTER TABLE "restaurant" ADD CONSTRAINT "FK_0a3bb02d45770035429791e3ea1" FOREIGN KEY ("countryId") REFERENCES "country"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant" DROP CONSTRAINT "FK_0a3bb02d45770035429791e3ea1"`);
        await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "countryId"`);
        await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "workingHours"`);
        await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "mainImage"`);
    }

}
