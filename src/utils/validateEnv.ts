import { cleanEnv, port, str } from "envalid"

const validateEnv = () => {
    cleanEnv(process.env, {
        PORT: port(),
        NODE_ENV: str(),
        POSTGRES_HOST: str(),
        POSTGRES_PORT: port(),
        POSTGRES_USER: str(),
        POSTGRES_PASSWORD: str(),
        POSTGRES_DB: str()
    })
}

export default validateEnv;