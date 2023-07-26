import { Entity, PrimaryGeneratedColumn, Column, Index, BeforeInsert } from "typeorm"
import * as bcrypt from 'bcryptjs';
import Model from "./model.entity"

export enum RoleEnumType {
    USER = 'user',
    ADMIN = 'admin',
}

@Entity('users')
export class User extends Model {

    // ? Hash password before saving to database
    @BeforeInsert()
    async hashPassword() {
        this.password = await bcrypt.hash(this.password, 12)
    }

    // ? Validate password
    static async comparePasswords(
        candidatePassword: string, 
        hashedPassword: string,
    ) {
        return await bcrypt.compare(candidatePassword, hashedPassword);
    }

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

