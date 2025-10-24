import fs from "fs";
import mysql from "mysql2/promise";
import { faker } from "@faker-js/faker";
import { randomUUID } from "crypto";

async function main() {
  const connection = await mysql.createConnection({
    host: "localhost",
    port: 3307,
    user: "supplyflavors",
    password: "p@ssw0rd",
    database: "analytics_database",
    multipleStatements: true,
  });

  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const brandId = 1;
  const statuses = [1, 2, 3, 4, 5, 6, 7];
  const currencies = ["EUR", "USD"];

  console.log("Loading base SQL data...");
  const baseSQL = fs.readFileSync("scripts/populate_analytics.sql", "utf8");
  await connection.query(baseSQL);
  console.log("Base data inserted.");

  console.log("Generating 150 countries...");
  const countryList = Array.from({ length: 150 }, () => {
    const name = faker.location.country();
    const iso = faker.string.alpha({ casing: "upper", length: 3 });
    return [iso, name, faker.date.past(), faker.date.recent(), 1, 1];
  });
  await connection.query(
    "INSERT INTO country (iso_code, name, created_at, modified_at, created_by, modified_by) VALUES ?",
    [countryList]
  );

  console.log("Generating 10000 cities...");
  const [countryRows] = await connection.query("SELECT iso_code FROM country");
  const isoCodes = countryRows.map(row => row.iso_code);

  for (let i = 0; i < 10; i++) {
    const cities = Array.from({ length: 1000 }, () => [
      faker.location.city(),
      faker.helpers.arrayElement(isoCodes)
    ]);
    await connection.query(
      "INSERT INTO city (name, iso_code) VALUES ?",
      [cities]
    );
  }

  console.log("Generating 70000 addresses...");
  const [cityRows] = await connection.query("SELECT city_id FROM city");
  const cityIds = cityRows.map(row => row.city_id);

  for (let i = 0; i < 70; i++) {
    const addresses = Array.from({ length: 1000 }, () => [
      faker.helpers.arrayElement(cityIds),
      faker.location.streetAddress(),
      faker.location.zipCode()
    ]);
    await connection.query(
      "INSERT INTO address (city_id, street, postal_code) VALUES ?",
      [addresses]
    );
  }

  console.log("Generating 10000 categories...");
  const categories = [];
  for (let i = 0; i < 10000; i++) {
    const parentId = i === 0 ? 1 : randInt(1, i); // garante que o parent já existe
    categories.push([
      faker.commerce.department(),
      parentId,
      faker.date.past(),
      faker.date.recent(),
      1,
      1
    ]);
  }
  await connection.query(
    "INSERT INTO category (name, parent_category_id, created_at, modified_at, created_by, modified_by) VALUES ?",
    [categories]
  );

  console.log("Generating 500000 company customers...");
  for (let i = 0; i < 500; i++) {
    const companies = Array.from({ length: 1000 }, () => [
      faker.company.name()
    ]);
    await connection.query("INSERT INTO customer (name) VALUES ?", [companies]);
  }

  console.log("Fetching valid category IDs...");
  const [categoryRows] = await connection.query("SELECT category_id FROM category");
  const categoryIds = categoryRows.map(row => row.category_id);

  console.log("Generating 100000 products...");
  for (let i = 0; i < 100; i++) {
    const products = Array.from({ length: 1000 }, () => [
      faker.commerce.productName(),
      faker.helpers.arrayElement(categoryIds),
      faker.commerce.price(2, 100, 2),
      brandId
    ]);
    await connection.query(
      "INSERT INTO product (name, category_id, price, brand_id) VALUES ?",
      [products]
    );
  }

  console.log("Generating 50000 payments...");
  for (let i = 0; i < 50; i++) {
    const payments = Array.from({ length: 1000 }, () => [
      randInt(1, 3),
      1,
      randInt(1, 2),
      faker.helpers.arrayElement(currencies),
      faker.finance.amount(10, 500, 2),
    ]);
    await connection.query(
      "INSERT INTO payment_info (payment_status_id, method_id, provider_id, iso_code_currency, amount) VALUES ?",
      [payments]
    );
  }

  console.log("Generating 400000 shipments...");
  const [addressRows] = await connection.query("SELECT address_id FROM address");
  const addressIds = addressRows.map(row => row.address_id);

  for (let i = 0; i < 400; i++) {
    const shipments = Array.from({ length: 1000 }, () => [
      faker.helpers.arrayElement(addressIds),
      randInt(1, 2),
      randomUUID(),
      faker.date.past(),
      faker.date.recent(),
    ]);
    await connection.query(
      "INSERT INTO shipment_info (address_id, carrier_id, tracking_number, shipped_at, delivered_at) VALUES ?",
      [shipments]
    );
  }

  console.log("Generating 500000 orders...");
  for (let i = 0; i < 500; i++) {
    const orders = Array.from({ length: 1000 }, () => [
      randInt(1, 500000),
      faker.helpers.arrayElement(statuses),
      randInt(1, 400000),
      randInt(1, 50000),
      faker.finance.amount(50, 1000, 2),
      brandId,
      faker.date.recent(),
    ]);
    await connection.query(
      "INSERT INTO orders (customer_id, status_id, shipment_id, payment_info_id, order_total, brand_id, created_at) VALUES ?",
      [orders]
    );
  }

  console.log("Generating 1500000 items for orders...");
  const [orderRows] = await connection.query("SELECT order_id FROM orders");
  let totalItems = 0;

  for (const { order_id } of orderRows) {
    const itemCount = randInt(1, 5);
    const items = [];

    for (let i = 0; i < itemCount; i++) {
      const product_id = randInt(1, 100000);
      const [rows] = await connection.query(
        "SELECT price FROM product WHERE product_id = ? LIMIT 1",
        [product_id]
      );
      if (!rows.length) continue;

      const price = rows[0].price;
      const quantity = randInt(1, 3);
      const total = (price * quantity).toFixed(2);

      items.push([order_id, product_id, quantity, price, total]);
    }

    if (items.length > 0) {
      await connection.query(
        "INSERT INTO items (order_id, product_id, quantity, unit_price, total_price) VALUES ?",
        [items]
      );
      totalItems += items.length;
    }

    if (totalItems >= 1500000) break;
  }

  console.log(`Inserted ${totalItems} items successfully.`);

  console.log("Generating 1000000 product views...");
  for (let i = 0; i < 1000; i++) {
    const views = Array.from({ length: 1000 }, () => [
      randInt(1, 500000),
      randInt(1, 100000),
      faker.date.recent()
    ]);
    await connection.query(
      "INSERT INTO product_view (customer_id, product_id, viewed_at) VALUES ?",
      [views]
    );
    console.log(`Inserted ${i * 1000 + 1000} views so far`);
  }

  console.log("Dynamic data population completed with Faker.js.");
  await connection.end();
}

main().catch((err) => {
  console.error("Error populating database:", err);
  process.exit(1);
});
