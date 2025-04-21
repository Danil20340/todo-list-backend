const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const knex = require('knex');
const config = require('../knexfile');
const db = knex(config);
require('dotenv').config();


const AuthController = {
    login: async (req, res) => {
        const { login, password } = req.body;
        if (!login || !password) {
            return res.status(400).json({ error: 'Все поля обязательные' });
        }

        try {
            const user = await db('users').where({ login }).first();

            if (!user) {
                return res.status(401).json({ error: 'Пользователя с таким логином не существует' });
            }

            const valid = await bcrypt.compare(password, user.password_hash);

            if (!valid) {
                return res.status(401).json({ error: 'Неверный пароль' });
            }

            const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, {
                expiresIn: '2d',
            });

            res.json({ token });
        } catch (error) {
            console.error('Error in login:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
module.exports = AuthController;