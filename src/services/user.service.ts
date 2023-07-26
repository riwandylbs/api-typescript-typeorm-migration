import config from "config";
import { User } from "../entities/user.entity";
import { CreateUserInput } from "../schemas/user.schema";
import redisClient from "../utils/connectRedis";
import { AppDataSource } from "../utils/data-source";
import { signJwt } from "../utils/jwt";

const userRepository = AppDataSource.getRepository(User)

export const createUser = async (input: CreateUserInput) => {
    return ( await AppDataSource.manager.save(
        AppDataSource.manager.create(User, input)
    )) as User;
};

export const findByEmail = async ( {email}: {email: string}) => {
    return await userRepository.findOneBy({email});
};

export const findById = async ( userId: number) => {
    return await userRepository.findOneBy({ id: userId })
};

export const findUser = async ( query: Object ) => {
    return await userRepository.findOneBy(query);
};

// ? Sign access and Refresh Tokens
export const singTokens = async (user: User) => {
    // Create session 
    redisClient.set((user.id).toLocaleString(), JSON.stringify(user), {
        EX: config.get<number>('redisCacheExpiresIn') * 60,
    })

    // Creata access and refresh token
    const access_token = signJwt({sub: user.id }, 'accessTokenPrivateKey', {
       expiresIn: `${config.get<number>('accessTokenExpiresIn')}m`,
    })

    const refresh_token = signJwt({ sub: user.id }, 'refreshTokenPrivateKey', {
        expiresIn: `${config.get<number>('refreshTokenExpiresIn')}m`,
    });

    return { access_token, refresh_token }
};