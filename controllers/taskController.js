const knex = require('knex');
const config = require('../knexfile');
const db = knex(config);

const TaskController = {
  getAll: async (req, res) => {
    const userId = req.user.id;

    try {
      const subordinates = await db('users')
        .where({ manager_id: userId })
        .pluck('id');

      const taskQuery = db('tasks')
        .select(
          'tasks.*',
          db.raw("CONCAT(assignee.first_name, ' ', assignee.last_name) as assignee_name"),
          db.raw("CONCAT(creator.first_name, ' ', creator.last_name) as creator_name")
        )
        .leftJoin('users as assignee', 'tasks.assignee_id', 'assignee.id')
        .leftJoin('users as creator', 'tasks.creator_id', 'creator.id')
        .orderBy('updated_at', 'desc');

      if (subordinates.length > 0) {
        taskQuery.whereIn('assignee_id', [userId, ...subordinates]);
      } else {
        taskQuery.where('assignee_id', userId);
      }

      const tasks = await taskQuery;
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  create: async (req, res) => {
    const { title, description, due_date, priority, status, assignee_id } = req.body;
    const userId = req.user.id;

    try {
      const currentUser = await db('users').where({ id: userId }).first();

      if (currentUser.manager_id) {
        return res.status(403).json({ error: 'Подчинённые не могут создавать задачи' });
      }
      const isSubordinate = await db('users')
        .where({ id: assignee_id, manager_id: userId })
        .first();

      if (!isSubordinate && assignee_id !== userId) {
        return res.status(400).json({ error: 'Можно назначить только подчинённого или себя' });
      }

      await db('tasks')
        .insert({
          title,
          description,
          due_date,
          priority,
          status,
          creator_id: userId,
          assignee_id,
        })
        .returning('*');

      res.status(201).json({ message: 'Задача успешно создана' });
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  update: async (req, res) => {
    const userId = req.user.id;
    const updates = req.body;

    try {
      const task = await db('tasks').where({ id: req.body.id }).first();

      if (!task) return res.status(404).json({ error: 'Задача не найдена' });

      // Если создатель — может всё
      if (task.creator_id === userId) {
        await db('tasks')
          .where({ id: req.body.id })
          .update({ ...updates, updated_at: new Date() });
        return res.json({ message: 'Задача обновлена' });
      }

      // Если исполнитель — может менять только статус (кроме cancelled)
      if (task.assignee_id === userId) {
        if (!updates.status) {
          return res.status(403).json({ error: 'Можно изменять только статус' });
        }

        if (updates.status === 'cancelled') {
          return res.status(403).json({ error: 'Вы не можете отменить задачу' });
        }

        await db('tasks')
          .where({ id: req.body.id })
          .update({
            status: updates.status,
            updated_at: new Date(),
          });

        return res.json({ message: 'Статус задачи обновлён' });
      }

      return res.status(403).json({ error: 'Нет доступа к задаче' });
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  delete: async (req, res) => {
    const userId = req.user.id;
    const taskId = req.body.id;

    try {
      const task = await db('tasks').where({ id: taskId }).first();

      if (!task) return res.status(404).json({ error: 'Задача не найдена' });

      if (task.creator_id !== userId) {
        return res.status(403).json({ error: 'Удаление разрешено только автору' });
      }

      await db('tasks').where({ id: taskId }).del();

      res.json({ message: 'Задача удалена' });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

module.exports = TaskController;
