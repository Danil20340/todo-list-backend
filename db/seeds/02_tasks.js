exports.seed = async function(knex) {
    // Очищаем таблицу
    await knex('tasks').del();
  
    await knex('tasks').insert([
      {
        title: 'Сделать презентацию',
        description: 'Подготовить слайды к совещанию',
        due_date: '2025-04-20',
        priority: 'high',
        status: 'pending',
        creator_id: 1,
        assignee_id: 2,
      },
      {
        title: 'Обновить документацию',
        description: 'Проверить API и внести правки',
        due_date: '2025-04-22',
        priority: 'medium',
        status: 'in_progress',
        creator_id: 1,
        assignee_id: 3,
      },
      {
        title: 'Проверка отчетов',
        description: 'Проверить финансовые отчеты за март',
        due_date: '2025-04-17',
        priority: 'low',
        status: 'done',
        creator_id: 2,
        assignee_id: 2,
      },
    ]);
  };
  