import { app } from "./app"
import { env } from "./env"

app.listen({
    port: env.PORT,
}).then(_ => {
    console.log(`Server listening on http://localhost:${env.PORT}`)
})