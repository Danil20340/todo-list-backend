/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
// db/migrations/YYYYMMDD_create_tasks_table.js

exports.up = function (knex) {
  return knex.schema.createTable('tasks', (table) => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('description');

    table.date('due_date').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').nullable();

    table.enu('priority', ['low', 'medium', 'high']).notNullable().defaultTo('medium');
    table.enu('status', ['pending', 'in_progress', 'done', 'cancelled']).notNullable().defaultTo('pending');

    table
      .integer('creator_id')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    table
      .integer('assignee_id')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('tasks');
};
