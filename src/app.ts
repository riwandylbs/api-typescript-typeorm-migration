import express, { Response } from "express"
import { AppDataSource } from "./utils/data-source"
import validateEnv from "./utils/validateEnv"
import redisClient from "./utils/connectRedis"
import config from "config"

AppDataSource.initialize()
    .then(async () => {

        // Validate ENV
        validateEnv()

        // create express app
        const app = express();

        // HEALTH CHECKER
        app.get('/api/healthchecker', async (_, res: Response) => {
            const message = await redisClient.get("try")
            res.status(200).json({
            status: 'success',
            message,
            });
        });
  
        // start express server
        const port = config.get<number>('port');
        app.listen(port)

        console.log(`Server Payment API started on : ${port}`)

}).catch(error => console.log(error))
