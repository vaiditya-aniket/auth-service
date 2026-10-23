import express, {Request,Response} from 'express';

import authRoutes from './routes/auth.js';
import { timeStamp } from 'node:console';
const app=express();
const PORT=process.env.PORT || 3000 ;

app.use(express.json());


app.use('/api/auth',authRoutes);
app.get('/health',(req:Request,res:Response)=>{
    res.status(200).json({status:'ok',timeStamp: new Date().toISOString()});
});
app.listen(PORT,()=>{
    console.log(`Server is running on http://localhost:${PORT}`);
})
