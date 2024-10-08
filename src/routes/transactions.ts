import { FastifyInstance } from "fastify"
import { knexConnection } from "../database"
import { z } from 'zod'
import { randomUUID } from "node:crypto"
import { checkSessionIsExists } from "../middlewares/check-session-id-exists"

export async function transactionsRoutes(app: FastifyInstance) {
    app.get('/', {
        preHandler: [
            checkSessionIsExists
        ],
    }, async (request, reply) => {

        const sessionId = request.cookies.sessionId

        const transactions = await knexConnection('transactions')
            .where('session_id', sessionId)
            .select('*')

        return reply.send({transactions})
    })

    app.get('/:id', {
        preHandler: [
            checkSessionIsExists
        ],
    }, async (request, reply) => {
        const getTransactionParamsSchema = z.object({
            id: z.string().uuid(),
        })

        const { sessionId } = request.cookies

        const { id } = getTransactionParamsSchema.parse(request.params) 

        const transaction = await knexConnection('transactions').where({
            id,
            session_id: sessionId
        }).first()

        if (!transaction) {
            return reply.status(404).send({ error: 'Transaction not found' })
        }

        return reply.send({transaction})
    })

    app.get('/summary', {
        preHandler: [
            checkSessionIsExists
        ],
    }, async (request, reply) => {
        const { sessionId } = request.cookies

        const summary = await knexConnection('transactions').where('session_id', sessionId).sum('amount', { as:'amount'}).first()

        return reply.send({summary})
    })

    app.post('/', async (request, reply) => {
        const createTransactionBodySchema = z.object({
            title: z.string(),
            amount: z.number(),
            type: z.enum(['credit','debit']),
        })

        const { title, amount, type } = createTransactionBodySchema.parse(request.body)

        let sessionId = request.cookies.sessionId

        if(!sessionId) {
            sessionId = randomUUID()
            reply.cookie('sessionId', sessionId, {
                path: '/',
                maxAge: 60 * 60 * 24 * 7 // 7 days
            })
        }

        await knexConnection('transactions').insert({
            id: randomUUID(),
            title,
            amount: type === 'credit' ? amount : amount * -1,
            session_id: sessionId
        })

        return reply.status(201).send()
    })
}
