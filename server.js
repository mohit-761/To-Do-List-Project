import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const port = 3000;
const app = express();
const apiUrl = `http://localhost:4000`;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//middleware for validation
function checkPassword(req, res, next) {
  let flag = false;
  const pass = req.body.password;
  const cpass = req.body.cpassword;
  if (pass === cpass) {
    flag = true;
  }
  if (flag === true) {
    next();
  } else {
    res.render("signin.ejs", {
      path:"/register",
      error: "Password And Confirm Password Does Not Match",
    });
  }
}

// getting current date
function currentDate(){
  const date = new Date();
 // const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const year = date.getFullYear();
  const month = date.getMonth();
  const cDate = date.getDate();
  return cDate+"-"+(month+1)+"-"+year;
}

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/register", (req, res) => {
  const route = req.path;
  res.render("signin.ejs", { path: route });
});

app.get("/userhome/:uid",async (req,res)=>{
  try{
     const uid = parseInt(req.params.uid);
     const response = await axios.get(`${apiUrl}/getAll/${uid}`);
     res.render("userhome.ejs",{userId: uid, usersTask: response.data});
  }catch(err){
    console.log(err.message);
  }
});

app.post("/addUser", checkPassword, async (req, res) => {
  //checkPassword is a middleware used to check weather the password and cpassword matches or not
  try {
    const data = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    };
    // console.log(data);
    const response = await axios.post(`${apiUrl}/addUser`, data);
    if(response.data.error === `user already exists`){
      res.render("signin.ejs",{path: "/register",error:"email already exists please login or try with another email"});
    }else{
      const uid = response.data.id;
      res.redirect(`/userhome/${uid}`);
    }
  } catch (err) {
    console.log(err.massege);
  }
});

app.get("/login", (req, res) => {
  const route = req.path;
  res.render("signin.ejs", { path: route });
});

app.post("/loginUser", async (req, res) => {
  try {
    const response = await axios.post(`${apiUrl}/login`, req.body);
    const result = response.data;
    if(result.emailIssue){
      res.render("signin.ejs",{error:"email does not exists please enter correct email",path:"/login"})
    }else if(result.passwordIssue){
      res.render("signin.ejs",{error:"please enter correct password",path:"/login"})
    }else{
      const uid = result[0].id;
      res.redirect(`/userhome/${uid}`);
    }
  } catch (err) {
    console.log(err.message);
  }
});

app.post("/newTask", async (req, res) => {
  try {
    const cDate = currentDate();
    const currUserId = req.body.userid;
    const data = {
      title: req.body.title,
      task: req.body.task,
      tdate: cDate,
      duedate: req.body.duedate,
      user_id: currUserId,
    }
    const response = await axios.post(`${apiUrl}/newTask`, data);
    res.redirect(`/userhome/${currUserId}`);
  } catch (err) {
    console.log(err.massege);
  }
});

app.get("/update/:taskId",async (req,res)=>{
  try{
     const taskId = parseInt(req.params.taskId);
     const userId = parseInt(req.query.sno);
    // console.log(taskId, userId);
     const task = await axios.get(`${apiUrl}/getATask/${taskId}`);
     res.render("modify.ejs",{result: task.data});
  }catch(err){
    console.log(err.message);
  }
})

app.post("/updatedTask/:taskId",async (req,res)=>{
 try{
    const tId = req.params.taskId;
    const preData = {
      title: req.body.title,
      task: req.body.task,
      duedate: req.body.duedate,
    };
    const response = await axios.put(`${apiUrl}/update/${tId}`,preData);
    const uid = response.data.user_id;
    res.redirect(`/userhome/${uid}`);
 }catch(err){
   console.log(err.message);
 }
})

app.get("/delete/:taskId",async (req,res)=>{
  try{
      const taskId = parseInt(req.params.taskId);
      const response = await axios.delete(`${apiUrl}/delete/${taskId}`);
      const userId = response.data.user_id;
      res.redirect("/userhome/"+userId);
  }catch(err){
    console.log(`error in deleting data`,err.message);
  }
})

app.listen(port, () => {
  console.log(`SERVER is listening on http://localhost:${port}`);
});
