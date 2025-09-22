import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1758541563744 implements MigrationInterface {
    name = 'Initial1758541563744'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cart" ADD "total" numeric(10,2) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cart" DROP COLUMN "total"`);
    }

}
