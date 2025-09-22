import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1758537543119 implements MigrationInterface {
    name = 'Initial1758537543119'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "like" ADD "countryId" uuid`);
        await queryRunner.query(`ALTER TABLE "order" ADD "notes" character varying`);
        await queryRunner.query(`ALTER TABLE "order" ADD "address" character varying`);
        await queryRunner.query(`ALTER TABLE "like" ADD CONSTRAINT "UQ_4b6db8b95b675e646561e54ff10" UNIQUE ("userId", "countryId")`);
        await queryRunner.query(`ALTER TABLE "like" ADD CONSTRAINT "FK_3f93b297d1ddb47ab860e720fac" FOREIGN KEY ("countryId") REFERENCES "country"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "like" DROP CONSTRAINT "FK_3f93b297d1ddb47ab860e720fac"`);
        await queryRunner.query(`ALTER TABLE "like" DROP CONSTRAINT "UQ_4b6db8b95b675e646561e54ff10"`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "like" DROP COLUMN "countryId"`);
    }

}
