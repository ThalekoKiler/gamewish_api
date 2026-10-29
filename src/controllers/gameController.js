const { Game, User } = require('../models');

class GameController {
    // POST
    static async create(req, res) {
        const { title, genre, platform, rating, status } = req.body;

        try {
            const game = await Game.create({
                title,
                genre,
                platform,
                rating,
                status,
                userId: req.userId
            });

            return res.status(201).json({
                message: 'Jogo cadastrado com sucesso!',
                game
            });
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao cadastrar jogo.', details: error.message });
        }
    }

    // GET
    static async getAll(req, res) {
        try {
            const games = await Game.findAll({
                include: {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                },
                order: [['createdAt', 'DESC']]
            });

            return res.status(200).json(games);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao listar jogos.', details: error.message });
        }
    }

    static async getMyGames(req, res) {
        try {
            const games = await Game.findAll({
                where: { userId: req.userId },
                order: [['createdAt', 'DESC']]
            });

            return res.status(200).json(games);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao listar seus jogos.' });
        }
    }

    static async getById(req, res) {
        const { id } = req.params;

        try {
            const game = await Game.findByPk(id, {
                include: {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                }
            });

            if (!game) {
                return res.status(404).json({ error: 'Jogo não encontrado.' });
            }

            return res.status(200).json(game);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao buscar jogo.' });
        }
    }

    // PUT
    static async update(req, res) {
        const { id } = req.params;
        const { title, genre, platform, rating, status } = req.body;

        try {
            const game = await Game.findByPk(id);

            if (!game) {
                return res.status(404).json({ error: 'Jogo não encontrado.' });
            }

            // Regra de segurança: valida a posse do registro
            if (game.userId !== req.userId) {
                return res.status(403).json({ error: 'Você não tem permissão para editar este jogo.' });
            }

            await game.update({ title, genre, platform, rating, status });

            return res.status(200).json({
                message: 'Jogo atualizado com sucesso!',
                game
            });
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao atualizar jogo.' });
        }
    }

    // DELETE
    static async remove(req, res) {
        const { id } = req.params;

        try {
            const game = await Game.findByPk(id);

            if (!game) {
                return res.status(404).json({ error: 'Jogo não encontrado.' });
            }

            // Regra de segurança: valida a posse do registro
            if (game.userId !== req.userId) {
                return res.status(403).json({ error: 'Você não tem permissão para excluir este jogo.' });
            }

            await game.destroy();

            return res.status(200).json({ message: 'Jogo removido com sucesso!' });
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao excluir jogo.' });
        }
    }
}

module.exports = GameController;