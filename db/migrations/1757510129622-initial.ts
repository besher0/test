import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1757510129622 implements MigrationInterface {
    name = 'Initial1757510129622'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "favoriteFood" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "favoriteFood"`);
    }

}
