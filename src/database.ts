import knex, { Knex } from "knex"
import { env } from "./env"

if(!env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL environment variable")    
}

export const knexDatabaseConfig: Knex.Config = {
    client: env.DATABASE_CLIENT,
    connection: env.DATABASE_CLIENT === 'sqlite' ? {
        filename: env.DATABASE_URL,
    } : env.DATABASE_URL,
    useNullAsDefault: true,
    migrations: {
        directory: './db/migrations',
        extension: 'ts',
    }
}

export const knexConnection = knex(knexDatabaseConfig)