import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm"
import Model from "./model.entity"

export enum RoleEnumType {
    USER = 'user',
    ADMIN = 'admin',
}

@Entity('users')
export class User extends Model {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    password: string;

    @Index('email_idx')
    @Column({
        unique: true
    })
    email: string;

    @Column({
        type: 'enum',
        enum: RoleEnumType,
        default: RoleEnumType.USER,
    })
    role: RoleEnumType.USER;
}

