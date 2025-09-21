import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1758494095427 implements MigrationInterface {
    name = 'Initial1758494095427'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "delivery_location" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "latitude" numeric(10,6) NOT NULL, "longitude" numeric(10,6) NOT NULL, "restaurantId" uuid, CONSTRAINT "PK_114fcecdca36fb589856f3303aa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."order_deliverytype_enum" AS ENUM('PICKUP_POINT', 'DELIVERY')`);
        await queryRunner.query(`ALTER TABLE "order" ADD "deliveryType" "public"."order_deliverytype_enum" NOT NULL DEFAULT 'DELIVERY'`);
        await queryRunner.query(`ALTER TABLE "order" ADD "userLatitude" numeric(10,6)`);
        await queryRunner.query(`ALTER TABLE "order" ADD "userLongitude" numeric(10,6)`);
        await queryRunner.query(`ALTER TABLE "order" ADD "restaurantId" uuid`);
        await queryRunner.query(`ALTER TABLE "order" ADD "deliveryLocationId" uuid`);
        await queryRunner.query(`ALTER TABLE "delivery_location" ADD CONSTRAINT "FK_f18a5d98872478009c68abea084" FOREIGN KEY ("restaurantId") REFERENCES "restaurant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_c93f22720c77241d2476c07cabf" FOREIGN KEY ("restaurantId") REFERENCES "restaurant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_f01f55bba552d43ff5ca10219a7" FOREIGN KEY ("deliveryLocationId") REFERENCES "delivery_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_f01f55bba552d43ff5ca10219a7"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_c93f22720c77241d2476c07cabf"`);
        await queryRunner.query(`ALTER TABLE "delivery_location" DROP CONSTRAINT "FK_f18a5d98872478009c68abea084"`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "deliveryLocationId"`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "restaurantId"`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "userLongitude"`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "userLatitude"`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "deliveryType"`);
        await queryRunner.query(`DROP TYPE "public"."order_deliverytype_enum"`);
        await queryRunner.query(`DROP TABLE "delivery_location"`);
    }

}
