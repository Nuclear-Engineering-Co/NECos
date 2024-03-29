import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("guilds", function (table) {
    table.increments("id");
    table.string("guild_id", 128).notNullable();
    table.json("configuration").notNullable().defaultTo('{"channels": { auditLogs: "-1", commandLogs: "-1" }, "commandPermissions": {}}');
    table.json("verification_bind_data").notNullable().defaultTo("{}");
    table.json("mod_actions").notNullable().defaultTo("[]");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("guilds");
}
