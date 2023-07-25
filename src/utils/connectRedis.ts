import { createClient } from 'redis'

const redisUrl = 'redis://localhost:6379'

const redisClient = createClient({
    url: redisUrl
})

const connectRedis = async () => {
    try {
        await redisClient.connect();
        console.log("Redis client connected successfully")
        redisClient.set("try", "Hello welcome to Payment API with ExpressJS")
    } catch (error) {
        console.log("Connect redis failed : ", error)
        setTimeout(connectRedis, 5000)
    }
};

connectRedis();

export default redisClient;