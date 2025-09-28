/* eslint-disable prettier/prettier */
import "reflect-metadata";
import dataSource from "./data-source";

async function checkEntities() {
  try {
    // الاتصال بقاعدة البيانات
    await dataSource.initialize();
    console.log("✅ Data Source has been initialized!");

    // جلب كل الكيانات (Entities) من DataSource
    const entities = dataSource.entityMetadatas;

    if (entities.length === 0) {
      console.log("⚠️ لم يتم العثور على أي Entities.");
    } else {
      console.log(`📦 عدد الـ Entities: ${entities.length}`);
      entities.forEach((entity) => {
        console.log(`- ${entity.name} (table: ${entity.tableName})`);
      });
    }

    // إغلاق الاتصال
    await dataSource.destroy();
    console.log("🔌 Connection closed.");
  } catch (err) {
    console.error("❌ Error during Data Source initialization:", err);
  }
}

checkEntities();
