import express from "express";
import db from "./database.js";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";

const port = 4000;
const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

async function getAllTask(id){
      const tasks = await db.query(`SELECT * FROM tasks where user_id = $1`,[id]);
      //console.log(tasks.rows);
      return tasks.rows;
}

app.get("/getAll/:uid",async (req,res)=>{
    try{
        const uid = parseInt(req.params.uid);
        const existingTasks = await getAllTask(uid);
        //console.log(existingTasks);
        res.json(existingTasks);
    }catch(err){
        console.log(err.message);
    }
})

app.get("/getATask/:taskId",async (req,res)=>{
    try{
        const taskId = parseInt(req.params.taskId);
        const task = await db.query(`SELECT * FROM tasks where id = $1`,[taskId]);
        const existingTask = task.rows[0];
        res.json(existingTask);
    }catch(err){
        console.log(err.message);
    }
})

app.post("/addUser",async (req,res)=>{
    try{
        const email = req.body.email;
        const existingUser = await db.query(`SELECT * FROM users where email = $1`,[email]);
        if(existingUser.rows.length>0){
            res.json({error: `user already exists`});
        }else{
            const password = req.body.password;
            const name = req.body.name;
            bcrypt.hash(password,6,async (err,result)=>{ // here result is the encrypted password
                if(err){
                    console.log(`Error in salting password`,err.stack);
                }else{
                    try{
                        const response = await db.query(`INSERT INTO USERS(name, email, password) values($1, $2, $3) RETURNING *`,[name, email, result]);
                        res.json(response.rows[0]);
                    }catch(err){
                        console.log(err.massege);
                    }
                }
            })
        }
    }catch(err){
        console.log(err.massege);
    }
})

app.post("/login",async(req,res)=>{
    try{
        const email = req.body.email;
        const existingUser = await db.query(`SELECT * FROM users where email=$1`,[email]);
        if(existingUser.rows.length > 0){
           const password = req.body.password;
           const savedPassword = existingUser.rows[0].password;
           bcrypt.compare(password, savedPassword, async (err,result)=>{
            if(err){
                console.log(`Error in Comparing password`,err.stack);
            }
            if(result){
            //console.log(existingUser.rows);    
            res.json(existingUser.rows);
            }else{
                res.json({passwordIssue: "please check your password"});
                }
           })
        }else{
            res.json({emailIssue: "email does not exists please enter correct email"});
        }
    }catch(err){
        console.log(err.massege);
    }
})

app.post("/newTask",async(req,res)=>{
   try{
        const title = req.body.title;
        const task = req.body.task;
        const tdate = req.body.tdate;
        const duedate = req.body.duedate;
        const user_id = req.body.user_id;
            //console.log(title, task, tdate, duedate, user_id);
             const result = await db.query(`INSERT INTO tasks(title, task, tdate,duedate, user_id) values($1,$2,$3,$4,$5) RETURNING *`,[title, task, tdate, duedate, user_id]);
            if(result.rows.length > 0){
            res.json(result.rows[0]);
             }else{
           res.sendStatus(300);
             }
   }catch(err){
    console.log(err);
   }
})

app.put("/update/:taskId",async (req,res)=>{
  try{
    console.log(req.body);
    const id = parseInt(req.params.taskId);
    const title = req.body.title;
    const task = req.body.task;
    const duedate = req.body.duedate;
    const response = await db.query(`UPDATE tasks set title = $1, task = $2, duedate = $3 where id = $4 RETURNING *`,[title, task, duedate, id]);
    if(response.rows.length > 0){
       res.json(response.rows[0]);
    }
  }catch(err){
    console.log(err.message);
  }
})


app.delete("/delete/:taskId",async (req,res)=>{
    try{
        const taskId = parseInt(req.params.taskId);
        const response = await db.query(`DELETE FROM tasks where id = $1 RETURNING *`,[taskId]);
        res.json(response.rows[0]);
    }catch(err){
        console.log(err.message);
    }
})

app.listen(port,()=>{
    console.log(`Api is listening on http://locahost:${port}`);
})