const bcrypt = require('bcryptjs');
const User = require('../models/User');
const createUserToken = require('../helpers/create-user-token');

class UserController {
    // POST
    static async register(req, res) {
        const { name, email, password } = req.body;

        try {
            // Verificar dupliciadade de email
            const userExists = await User.findOne({ where: { email } });
            if (userExists) {
                return res.status(422).json({ error: 'Este email já está em uso!' });
            }

            // Criar Hash da senha
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Salvar no banco
            const user = await User.create({
                name,
                email,
                password: hashedPassword
            });

            return await createUserToken(user, req, res);
        } catch (error) {
            console.error('ERRO DETALHADO NO REGISTO:', error);
            return res.status(500).json({ error: 'Erro ao registrar usuário', details: error.message });
        }
    }

    static async login(req, res) {
        const { email, password } = req.body;

        try {
            // Buscar usuário por email
            const user = await User.findOne({ where: { email } });
            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado.' });
            }

            // Comparar senha criptografada
            const checkPassword = await bcrypt.compare(password, user.password);
            if (!checkPassword) {
                return res.status(422).json({ error: 'Senha incorreta.' });
            }

            // Retornar os JSONS
            return await createUserToken(user, req, res);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao realizar login.', details: error.message });
        }
    }

    // GET
    static async checkUser(req, res) {
        try {
            const user = await User.findByPk(req.userId, {
                attributes: { exclude: ['password'] } // Nunca expõe a senha
            });

            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado.' });
            }

            return res.status(200).json(user);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao buscar usuário logado.' });
        }
    }
}

module.exports = UserController;