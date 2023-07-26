import { CookieOptions, NextFunction, Request, Response } from "express";
import config from "config"
import { CreateUserInput, LoginUserInput } from "../schemas/user.schema";
import { createUser, findByEmail, findById, signTokens } from "../services/user.service";
import { User } from "../entities/user.entity";
import AppError from "../utils/appError";
import { signJwt, verifyJwt } from "../utils/jwt";
import redisClient from "../utils/connectRedis";

const cookiesOptions: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax'
}

if (process.env.NODE_ENV == 'productions') cookiesOptions.secure = true;

const accessTokenCookieOptions: CookieOptions = {
    ...cookiesOptions,
    expires: new Date(
        Date.now() + config.get<number>('accessTokenExpiresIn') * 60 * 1000
    ),
    maxAge: config.get<number>('accessTokenExpiresIn') * 60 * 1000
}

const refreshTokenCookieOptions: CookieOptions = {
    ...cookiesOptions, 
    expires: new Date(
        Date.now() + config.get<number>('refreshTokenExpiresIn') * 60 * 1000
    ),
    maxAge: config.get<number>('refresTokenExpiresIn') * 60 * 1000
}

// User Register
export const registerUserHandler = async (
    req: Request<{}, {}, CreateUserInput>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name, password, email } = req.body

        const user = await createUser({
            name, 
            email: email.toLowerCase(),
            password, 
        })

        res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            data: {
                user, 
            }
        });
    } catch (err: any) {
        if (err.code === '23505') {
            return res.status(509).json({
                status: 'fail',
                message: 'User with that email already exist'
            });
        }
        next(err);
    }
}

// User Login
export const loginUserHandler = async ( 
    req: Request<{}, {}, LoginUserInput>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, password } = req.body
        const user = await findByEmail({email});

        if (!user || !(await User.comparePasswords(password, user.password))) {
            return next(new AppError(400, 'Invalid email or password'))
        }

        const {access_token, refresh_token} = await signTokens(user)
        res.cookie('access_token', access_token, accessTokenCookieOptions)
        res.cookie('refresh_token', refresh_token, refreshTokenCookieOptions)
        res.cookie('logged_in', true, {
            ...accessTokenCookieOptions,
            httpOnly: true
        })

        res.status(200).json({
            status: 'success',
            message: 'Login Success',
            access_token
        })

    } catch (err: any) {
        next(err)
    }
};

// Refresh Token 
export const refreshAccessTokenHandler = async (
    req: Request, 
    res: Response, 
    next: NextFunction
) => {
    try {
        const refresh_token = req.cookies.refresh_token;

        const message = 'Could not refresh access token';

        if (!refresh_token) {
            return next(new AppError(403, message));
        }

        // Validate refresh token
        const decoded = verifyJwt<{sub: string}>(
            refresh_token, 
            'refreshTokenPublicKey'
        );

        if (!decoded) {
            return next(new AppError(403, message));
        }

        // Check user has a valid session
        const session = await redisClient.get(decoded.sub);
        if(!session) {
            return next(new AppError(403, message));
        }

        // Check if usr still exist
        const user = await findById(JSON.parse(session).id);
        if (!user) {
            return next(new AppError(403, message));
        }

        // Sign new access token
        const access_token = signJwt({sub: user.id}, 'accessTokenPrivateKey', {
            expiresIn: `${config.get<number>('accessTokenExpiresIn')}m`
        });

        res.cookie('access_token', access_token, accessTokenCookieOptions);
        res.cookie('logged_in', true, {
            ...accessTokenCookieOptions,
            httpOnly: false
        });

        res.status(200).json({
            status: 'success',
            message: 'Refreshed access token is success',
            access_token,
        });
    } catch (err: any) {
        next(err)
    }
};

const logout = (res: Response ) => {
    res.cookie('access_token', '', {maxAge: -1});
    res.cookie('refresh_token', '', {maxAge: -1});
    res.cookie('logged_in', '', {maxAge: -1});
}

export const logoutHandler = async (
    req: Request, 
    res: Response, 
    next: NextFunction
) => {
    try {
        const user = res.locals.user;

        await redisClient.del(user.id);
        logout(res);

        res.status(200).json({
            status: 'success'
        })
    } catch (err: any) {
        next(err)
    }
};