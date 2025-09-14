import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1757821029102 implements MigrationInterface {
    name = 'Initial1757821029102'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_13e8b2a21988bec6fdcbb1fa741"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "favoriteFood" uuid`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_f858d979ec3472557a387ab517b" FOREIGN KEY ("favoriteFood") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_f858d979ec3472557a387ab517b"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "favoriteFood"`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_13e8b2a21988bec6fdcbb1fa741" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
