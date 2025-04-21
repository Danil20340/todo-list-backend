const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { AuthController } = require('../controllers')
const { UserController } = require('../controllers')
const { TaskController } = require('../controllers')

//Авторизация
router.post('/login', AuthController.login)

//Получение данных пользователей
router.get('/me', authenticateToken, UserController.getCurrentUser)
router.get('/subordinates', authenticateToken, UserController.getSubordinates)

//Работа с задачами
router.get('/', authenticateToken, TaskController.getAll);
router.post('/', authenticateToken, TaskController.create);
router.patch('/', authenticateToken, TaskController.update);
router.delete('/', authenticateToken, TaskController.delete);

module.exports = router;