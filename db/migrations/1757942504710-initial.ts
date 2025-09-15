import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1757942504710 implements MigrationInterface {
    name = 'Initial1757942504710'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meal" DROP COLUMN "price"`);
        await queryRunner.query(`ALTER TABLE "meal" ADD "price" double precision DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meal" DROP COLUMN "price"`);
        await queryRunner.query(`ALTER TABLE "meal" ADD "price" numeric(10,2) NOT NULL`);
    }

}
