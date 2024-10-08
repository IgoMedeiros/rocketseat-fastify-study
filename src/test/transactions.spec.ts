import { test, beforeAll, afterAll, describe, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../app'
import { execSync } from 'node:child_process'


describe('Transactions routes', () => {
    beforeAll(async () => {
        await app.ready()
    })
    
    afterAll(async () => {
        await app.close()
    })

    beforeEach(() => {
        execSync('yarn knex migrate:rollback --all')
        execSync('yarn knex migrate:latest')
    })
    
    test('user can create a new transaction', async () => {
        await request(app.server).post('/transactions').send({
            amount: 100,
            title: 'Test transaction',
            type: 'credit',
        }).expect(201)
    })

    test('user should be able to list all transactions', async () => {
        const transactionCreated = await request(app.server).post('/transactions').send({
            amount: 100,
            title: 'Test transaction',
            type: 'credit',
        })

        const cookies = transactionCreated.get('Set-Cookie')!

        const listTransactionsResponse = await request(app.server).get('/transactions').set('Cookie', cookies).expect(200)

        expect(listTransactionsResponse.body.transactions).toEqual([
            expect.objectContaining({
                title: 'Test transaction',
                amount: 100,
            })
        ])
    })

    test('user should be able to get specific transaction', async () => {
        const transactionCreated = await request(app.server).post('/transactions').send({
            amount: 100,
            title: 'Test transaction',
            type: 'credit',
        })

        const cookies = transactionCreated.get('Set-Cookie')!

        const listTransactionsResponse = await request(app.server).get('/transactions').set('Cookie', cookies).expect(200)

        const transactionId = listTransactionsResponse.body.transactions[0].id

        const getTransaction = await request(app.server).get(`/transactions/${transactionId}`).set('Cookie', cookies).expect(200)

        expect(getTransaction.body.transaction).toEqual(
            expect.objectContaining({
                title: 'Test transaction',
                amount: 100,
            })
        )
    })

    test('user should be able to get the summary', async () => {
        const transactionCreated = await request(app.server).post('/transactions').send({
            amount: 100,
            title: 'Test transaction',
            type: 'credit',
        })

        const cookies = transactionCreated.get('Set-Cookie')!

        const transactionCreated2 = await request(app.server)
        .post('/transactions')
        .set('Cookie', cookies)
        .send({
            amount: 49,
            title: 'second transaction',
            type: 'debit',
        })

        const getSummary = await request(app.server).get('/transactions/summary').set('Cookie', cookies).expect(200)

        expect(getSummary.body.summary).toEqual(
            expect.objectContaining({
                amount: 51,
            })
        )
    })
})