const knex = require('knex');
const config = require('../knexfile');
const db = knex(config);

const UserController = {
  getCurrentUser: async (req, res) => {
    try {
      const user = await db('users')
        .select('id', 'first_name', 'last_name', 'middle_name', 'login', 'manager_id')
        .where({ id: req.user.id })
        .first();

      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getSubordinates: async (req, res) => {
    try {
      const subordinates = await db('users')
        .select('id', 'first_name', 'last_name', 'middle_name', 'login')
        .where({ manager_id: req.user.id });

      res.json(subordinates);
    } catch (error) {
      console.error('Error fetching subordinates:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

module.exports = UserController;
