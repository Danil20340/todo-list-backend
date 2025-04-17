const bcrypt = require('bcrypt');

exports.seed = async function(knex) {
  // Очищаем таблицу
  await knex('users').del();

  const password = await bcrypt.hash('password123', 10);

  await knex('users').insert([
    {
      id: 1,
      first_name: 'Ivan',
      last_name: 'Petrov',
      middle_name: 'Sergeevich',
      login: 'ivan',
      password_hash: password,
      manager_id: null, // Руководитель
    },
    {
      id: 2,
      first_name: 'Anna',
      last_name: 'Ivanova',
      middle_name: 'Petrovna',
      login: 'anna',
      password_hash: password,
      manager_id: 1, // Подчинённая Ивану
    },
    {
      id: 3,
      first_name: 'Oleg',
      last_name: 'Sidorov',
      middle_name: null,
      login: 'oleg',
      password_hash: password,
      manager_id: 1, // Подчинённый Ивану
    },
  ]);
};
