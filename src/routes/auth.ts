import {Router,Request,Response} from 'express';
import bcrypt from 'bcryptjs';
import {success, z} from 'zod';
import {prisma} from '../prisma.js';
import { error } from 'node:console';


const router=Router();

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

