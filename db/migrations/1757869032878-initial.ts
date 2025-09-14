import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1757869032878 implements MigrationInterface {
    name = 'Initial1757869032878'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "like" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "mealId" uuid, "restaurantId" uuid, CONSTRAINT "UQ_fed609b2b0f732605806ff8266b" UNIQUE ("userId", "restaurantId"), CONSTRAINT "UQ_cd752e779aabd11e6ad2f23ce3e" UNIQUE ("userId", "mealId"), CONSTRAINT "PK_eff3e46d24d416b52a7e0ae4159" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "like" ADD CONSTRAINT "FK_e8fb739f08d47955a39850fac23" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "like" ADD CONSTRAINT "FK_9d921c64283bcbb6da4883e63c7" FOREIGN KEY ("mealId") REFERENCES "meal"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "like" ADD CONSTRAINT "FK_d4fc482ede6f58e369180aad6d1" FOREIGN KEY ("restaurantId") REFERENCES "restaurant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "like" DROP CONSTRAINT "FK_d4fc482ede6f58e369180aad6d1"`);
        await queryRunner.query(`ALTER TABLE "like" DROP CONSTRAINT "FK_9d921c64283bcbb6da4883e63c7"`);
        await queryRunner.query(`ALTER TABLE "like" DROP CONSTRAINT "FK_e8fb739f08d47955a39850fac23"`);
        await queryRunner.query(`DROP TABLE "like"`);
    }

}
