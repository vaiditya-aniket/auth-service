import {Router,Request,Response} from 'express';
import bcrypt from 'bcryptjs';
import {success, z} from 'zod';
import {prisma} from '../prisma.js';
import { error } from 'node:console';
import jwt from 'jsonwebtoken';


const router=Router();


const loginSchema =z.object({
    email: z.email({message:"Invalid email address"}),
    password:z.string().min(1,{message: 'Password is required'}),
});

router.post('/login',async(req:Request, res:Response): Promise<any>=>{
    try{
        const parseResult=loginSchema.safeParse(req.body);
        if(!parseResult.success){
            return res.status(400).json({
                success: false,
                error: parseResult.error.issues[0].message,
            });
        }
        const {email,password} =parseResult.data;
        const normalizedEmail=email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
            where: {email:normalizedEmail},
        });

        if(!user){
            return res.status(401).json({
                success:false,
                message:'Invald email or password',
            });
        }
        const isPasswordValid = await bcrypt.compare(password,user.password);
        if(!isPasswordValid){
            return res.status(401).json({
                success:false,
                message:'Invalid email or password',
            });
        }

        const secret=process.env.JWT_SECRET || 'fallback-secret';
        const accessToken =jwt.sign(
            {
                userId: user.id,role:user.role
            },
            secret,
            {expiresIn:'15m'}
        );
        return res.status(200).json({
            success:true,
            data:{
                accessToken,
                user:{
                    id:user.id,
                    email:user.email,
                    role:user.role,
                },
            },
        });

    }
    catch(error){
        console.error('Login Error:',error);
        return res.staus(500).json({
            success:false,
            message:'Internal Server Error',
        });
    }
});



const registerSchema = z.object({
    email: z.email({message:'Invalid email address'}),
    password:z.string().min(6,{message:'Password must be at least 6 characters long'}),
});

router.post('/register', async (req: Request,res: Response): Promise<any> =>{
    try{
        const parseResult= registerSchema.safeParse(req.body);
        if(!parseResult.success){
            return res.status(400).json({
                success:false,
                error:parseResult.error.issues[0].message,
            });
        }
        const {email,password} = parseResult.data;
        const normalizedEmail =email.toLowerCase().trim();
        const existingUser = await prisma.user.findUnique({
            where :{ email: normalizedEmail},
        });
        if(existingUser){
            return res.status(409).json({
                success: false,
                message: 'Registration failed. Please check your details and try again.',
            });
        }
        const hashedPassword=await bcrypt.hash(password,10);

        const user = await prisma.user.create({
            data:{
                    email:normalizedEmail,
                    password:hashedPassword,   
                },
            select: {
                id:true,
                email:true,
                role:true,
                createdAt:true,
            },
        });

        return res.status(201).json({
            success:true,
            data:user,
        });

    }
    catch(error){
        console.error('Registration Error:',error);
        return res.status(500).json({
            success:false,
            message:'Internal Server error',
        });
    }
})

export default router;

