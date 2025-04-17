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
                return res.status(401).json({ error: 'Неверный логин или пароль' });
            }

            const valid = await bcrypt.compare(password, user.password_hash);

            if (!valid) {
                return res.status(401).json({ error: 'Неверный логин или пароль' });
            }

            const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, {
                expiresIn: '2d',
            });

            res.json({ token });
        } catch (error) {
            console.error('Error in login:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    register: async (req, res) => {
        const { login, password, fullname, age, gender } = req.body;
        if (!login?.trim() || !password?.trim() || !fullname?.trim() || !age?.toString().trim() || !gender?.trim()) {
            return res.status(400).json({ error: 'Не все поля заполнены' });
        }

        // Проверка что fullName состоит ровно из трех слов
        const nameParts = fullname.trim().split(/\s+/);
        if (nameParts.length !== 3) {
            return res.status(400).json({ error: 'ФИО должно состоять ровно из трех слов' });
        }

        try {
            const existingUser = await db('players').where({ login }).first();
            if (existingUser) {
                return res.status(400).json({ error: 'Пользователь уже существует' });
            }

            const admin = await db('players').where({ id: req.player.id }).first();
            if (!admin || !admin.isAdmin) {
                return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            await db.transaction(async (trx) => {
                const [newPlayer] = await trx('players').insert({
                    fullName: fullname,
                    age: parseInt(age),
                    gender,
                    login,
                    password: hashedPassword,
                }).returning(['id', 'fullName', 'age', 'gender']);

                await trx('ratings').insert({
                    playerId: newPlayer.id, // Связываем рейтинг с игроком по id
                    wins: 0,
                    losses: 0,
                    draw: 0,
                });

                res.json(newPlayer);
            });
        } catch (error) {
            console.error('Error in register:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    updatePlayer: async (req, res) => {
        const { id, login, password, fullname, age, gender } = req.body;
        console.error("Игрок не найден");
        try {
            // Проверка прав администратора
            const admin = await db('players').where({ id: req.player.id }).first();
            if (!admin || !admin.isAdmin) {
                return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора' });
            }

            // Проверка существования игрока
            const existingPlayer = await db('players').where({ id }).first();
            if (!existingPlayer) {
                return res.status(404).json({ error: 'Игрок не найден' });
            }

            // Подготовка данных для обновления
            const updateData = {};

            if (fullname && fullname.trim() !== '') {
                // Проверка, что fullName состоит ровно из трех слов
                const nameParts = fullname.trim().split(/\s+/);
                if (nameParts.length !== 3) {
                    return res.status(400).json({ error: 'ФИО должно состоять ровно из трех слов' });
                }
                updateData.fullName = fullname;
            }

            if (age && !isNaN(parseInt(age))) updateData.age = parseInt(age);
            if (gender && gender.trim() !== '') updateData.gender = gender;

            if (login && login.trim() !== '') {
                // Проверка уникальности логина
                const loginExists = await db('players')
                    .where({ login })
                    .whereNot({ id }) // Исключаем текущего игрока
                    .first();

                if (loginExists) {
                    return res.status(400).json({ error: 'Такой логин уже существует' });
                }
                updateData.login = login;
            }

            if (password && password.trim() !== '') {
                updateData.password = await bcrypt.hash(password, 10);
            }

            // Обновление игрока
            await db('players').where({ id }).update(updateData);

            // Получение обновленных данных без пароля
            const updatedPlayer = await db('players')
                .where({ id })
                .select('id', 'fullName', 'age', 'gender', 'status', 'availability', 'createdAt', 'updatedAt', 'isAdmin')
                .first();

            res.json({
                message: 'Игрок успешно обновлен',
                player: updatedPlayer
            });

        } catch (error) {
            console.error('Error in updatePlayer:', error);
            res.status(500).json({
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },
    getAllPlayers: async (req, res) => {
        try {
            // Проверка прав администратора
            const admin = await db('players').where({ id: req.player.id }).first();

            // Получение всех игроков, исключая администраторов
            const players = await db('players')
                .where({ isAdmin: false })
                .select(
                    'id',
                    'fullName',
                    'age',
                    'gender',
                    'status',
                    'availability',
                    'createdAt',
                    'updatedAt'
                )
                .orderBy('createdAt', 'asc');

            res.json(players);

        } catch (error) {
            console.error('Error in getAllPlayers:', error);
            res.status(500).json({
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },
    changePlayerStatus: async (req, res) => {
        const { id } = req.params; // ID игрока

        try {
            // Проверка прав администратора
            const admin = await db('players').where({ id: req.player.id }).first();

            if (!admin || !admin.isAdmin) {
                return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора' });
            }

            // Проверка существования игрока
            const existingPlayer = await db('players').where({ id }).first();

            if (!existingPlayer) {
                return res.status(404).json({ error: 'Игрок не найден' });
            }

            // Переключение статуса
            const newStatus = existingPlayer.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';

            // Обновление статуса
            await db('players')
                .where({ id })
                .update({ status: newStatus });

            const updatedPlayer = await db('players')
                .where({ id })
                .select('id', 'fullName', 'status')
                .first();

            res.json({
                message: `Статус игрока успешно переключен на ${newStatus}`,
                player: updatedPlayer
            });

        } catch (error) {
            console.error('Error in changePlayerStatus:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    getPlayerById: async (req, res) => {
        try {
            const { id } = req.params; // id игрока передается в параметрах запроса

            const player = await db('players')
                .where({ id })
                .select('id', 'fullName', 'age', 'gender')
                .first();

            if (!player) {
                return res.status(404).json({ error: 'Игрок не найден' });
            }

            res.json(player);
        } catch (error) {
            console.error('Error in getPlayerById:', error);
            res.status(500).json({
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },
    getCurrentPlayer: async (req, res) => {
        try {
            const player = await db('players')
                .where({ id: req.player.id })
                .select('id', 'fullName', 'age', 'availability', 'status', 'gender', 'isAdmin')
                .first();

            if (!player) {
                return res.status(404).json({ error: 'Игрок не найден' });
            }

            return res.status(200).json(player);
        } catch (error) {
            console.error('Error in getCurrentPlayer:', error);
            res.status(500).json({
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

}
module.exports = AuthController;