import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1758804195639 implements MigrationInterface {
    name = 'Initial1758804195639'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."restaurant_type_enum" AS ENUM('restaurant', 'store')`);
        await queryRunner.query(`ALTER TABLE "restaurant" ADD "type" "public"."restaurant_type_enum" NOT NULL DEFAULT 'restaurant'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."restaurant_type_enum"`);
    }

}
