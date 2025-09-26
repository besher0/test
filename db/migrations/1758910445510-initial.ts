import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1758910445510 implements MigrationInterface {
    name = 'Initial1758910445510'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."business_type_enum" AS ENUM('restaurant', 'store')`);
        await queryRunner.query(`ALTER TABLE "follow" ADD "type" "public"."business_type_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "follow" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."business_type_enum"`);
    }

}
