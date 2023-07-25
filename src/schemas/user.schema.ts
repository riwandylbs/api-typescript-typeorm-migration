import { TypeOf, object, string, z } from 'zod'
import { RoleEnumType } from '../entities/user.entity'

export const createUserSchema = object({
   body: object({
        name: string({
            required_error: "Name is required",
        }),
        email: string({
            required_error: "Email is required",
        }).email("Invalid email address"),
        password: string({
            required_error: "Password is required",
        }).min(8, "Password must be moore than 8 Characters"),
        passwordConfirm: string({
            required_error: "Please confirm your password",
        }),
        role: z.optional(z.nativeEnum(RoleEnumType))
   }).refine((data) => data.password === data.passwordConfirm, {
        path: ['passwordConfirm'],
        message: "Password do not match"
   })
});

export const loginUserSchema = object({
    body: object({
        email: string({
            required_error: "Email is required"
        }).email("Invalid email address"),
        password: string({
            required_error: "Password is required"
        }).min(8, 'Invalid email or password'),
    })
});

export type CreateUserInput = Omit<TypeOf<typeof createUserSchema>['body'], 
    'passwordConfirm'
>;

export type LoginUserInput = TypeOf<typeof loginUserSchema>['body'];