/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('users', (table) => {
        table.increments('id').primary();
        table.string('first_name').notNullable();
        table.string('last_name').notNullable();
        table.string('middle_name');
        table.string('login').unique().notNullable();
        table.string('password_hash').notNullable();

        table
            .integer('manager_id')
            .unsigned()
            .references('id')
            .inTable('users')
            .onDelete('SET NULL'); 

        table.timestamps(true, true);
    });
};
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('users');
};
