require('dotenv').config()
const bcrypt = require('bcrypt');
const express = require("express")
const session = require("express-session");
const { default: mongoose, get } = require("mongoose");
const app = express()
let greeting; // تحديد نوع التحيه للطالب


// الاتصال الأول
const studentsDB = mongoose.createConnection(
    `mongodb+srv://admin-mohammed:${process.env.DBPASSWORD}@cluster0.c4wkhb3.mongodb.net/students`
);

// الاتصال الثاني
const reviewsDB = mongoose.createConnection(
    `mongodb+srv://admin-mohammed:${process.env.DBPASSWORD}@cluster0.c4wkhb3.mongodb.net/reviews`
);
const studentsSchema = mongoose.Schema({
    name:String,
    email:String,
    country:String,
    gender:String,
    whatsapp:Number,
    password:String,
   
    attendance:[
        {      
                studentName:String,
                LectureNumber:String,
                present: {
                    type:Boolean,
                    default:false
                },
                attendanceDate:Date,
        }
    ],
    role:String,
     gaveReview:{
        type:Boolean,
        default:false,
    },
     tasks: [
    {
        title: String,
        description: String,
        deadline: Date,
        seen: Boolean,
        submitted: {
                     type: Boolean,
                     default: false
                    },
                    submittedDay:String,
                    githubLink: {
                        type: String,
                        default: ""
                     },
                 taskEvaluation: {
                     type: String,
                    default: ""
                        }
    }
]



})

const Student = studentsDB.model("student",studentsSchema)
const reviewsSchema = mongoose.Schema({
    name:String,
    rating:Number,
    comment:String,
})
const Review = reviewsDB.model("review",reviewsSchema)


app.set("view engine","ejs")
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"))


function check(req,res,next){
    console.log(req.session.previousPage);
    
if(req.session.isAuth && req.session.role === "student"){
    next()
} else {
    res.redirect(req.session.previousPage)
}
}

function adminCheck(req, res, next) {


    if (req.session.isAuth && req.session.role === "admin") {
        next();
    } else{ 
console.log(req.session.previousPage);

        res.redirect(req.session.previousPage)
    } 

}
app.use(
    session({
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: false
    })
);
app.get('/',async(req,res)=>{
    let arrayOfStudens = await Student.find({})
    let totalStudents = arrayOfStudens.length
    
res.render("index",{wrong:"",totalStudents:totalStudents})
})

app.get("/login",(req,res)=>{
if(req.session.isAuth && req.session.role == "student"){
    res.redirect("/student-dashboard")
} else if(req.session.isAuth && req.session.role == "admin"){

res.redirect("/admin-dashboard")
}else{

    res.render("login")
}
})
app.post("/login", async (req, res) => {

    let email = req.body.email;
    let password = req.body.password;

    // ابحث عن المستخدم بواسطة الإيميل فقط
    let user = await Student.findOne({ email: email });

    // الإيميل غير موجود
    if (!user) {
        return res.redirect("/login");
    }

    // فحص كلمة المرور
    const isMatch = await bcrypt.compare(password, user.password);

    // كلمة المرور خاطئة
    if (!isMatch) {
        return res.redirect("/login");
    }

    // Admin
    if (user.role === "admin") {

        req.session.isAuth = true;
        req.session.role = user.role;
        req.session.name = user.name;
        req.session.email = user.email;
        req.session.previousPage = req.originalUrl;

        return res.redirect("/admin-dashboard");
    }

    // Student
    req.session.isAuth = true;
    req.session.role = user.role;
    req.session.name = user.name;
    req.session.email = user.email;
    req.session.country = user.country;
    req.session.whatsapp = user.whatsapp;
    req.session.previousPage = req.originalUrl;
    req.session.greeting = greeting;
    req.session.studentID = user._id;

    return res.redirect("/student-dashboard");
});

app.post("/signup",async(req,res)=>{
    let name = req.body.name
    let email = req.body.email
    let country = req.body.country
    let gender = req.body.gender
    let whatsapp = req.body.whatsapp

    let password = req.body.password
    const hashedPsw = await bcrypt.hash(password,15)

    let checkEmail = await Student.findOne({email:email})
    
    
    if(email == "mas.webdev24@gmail.com" ){
         let newStudent = new Student({
        name:name,
        email:email,
        country:country,
        gender:gender,
        whatsapp:whatsapp,
        password:hashedPsw,
        role:"admin"
    })
    await newStudent.save() 
    res.redirect("/login")
    } else

   if(!checkEmail){
    let newStudent = new Student({
        name:name,
        email:email,
        country:country,
        gender:gender,
        whatsapp:whatsapp,
        password:hashedPsw,
        role:"student"
    })
    await newStudent.save() 
    res.redirect("/login")
    
   } else {
  
    res.render("index",{wrong:"هذا البريد الالكتروني مسجل في قاعده البيانات اختر بريد الكتروني اخر" })
   }
   
})
   
    app.get("/logout",(req,res)=>{
       req.session.destroy()
        res.redirect("/")
    })
       
      

app.get("/student-dashboard",check,async(req,res)=>{
    let notification = await Student.findOne({_id:req.session.studentID})
    let arrayOfNoSeen = notification.tasks.filter(task => task.seen == false)
    let adminInfo = await Student.findOne({_id:"6a935cb4b1fe2da5f68cfb6f"})
    let totalTasks = adminInfo.tasks.length

    let numbersOfSubmitted = 0
    notification.tasks.forEach(task =>{
        if(task.submitted == true)
        numbersOfSubmitted++
    })
    console.log(numbersOfSubmitted);
    

    
    
    req.session.previousPage = req.originalUrl
    res.render("student-dashboard",{numbersOfSubmitted,totalTasks,notification:notification,arrayOfNoSeen,arrayOfNoSeen,name:req.session.name,email:req.session.email,country:req.session.country,whatsapp:req.session.whatsapp,greetingStudent:req.session.greeting})
})
app.get("/student-tasks",check,async(req,res)=>{
    let notification = await Student.findOne({_id:req.session.studentID})
    console.log(notification);
    console.log(req.session.studentID);
    
    
   let classForNoSeenTask = notification.tasks.filter(task => task.seen == false)
    
  
   
    
    res.render("student-tasks",{notification:notification,classForNoSeenTask:classForNoSeenTask,name:req.session.name,email:req.session.email,country:req.session.country,whatsapp:req.session.whatsapp,greetingStudent:req.session.greeting})
})

app.get("/student-tasks/:titleID",async(req,res)=>{
     let title = req.params.titleID;
     let titleFromDB = await Student.findOne({_id:req.session.studentID})

   
    
     
await Student.updateOne(
    {
        _id: req.session.studentID,
        "tasks.title": title
    },
    {
        $set: {
            "tasks.$.seen": true
        }
    }
);
     
     titleFromDB.tasks.forEach(task=>{
 if(title === task.title && task.submitted !== ""){
    let taskEvaluation = task.taskEvaluation
         res.render("task",{titleTask:task,studentID:req.session.studentID,taskEvaluation})
 }
 
     })
   
    
})




app.get("/admin-dashboard",adminCheck,async(req,res)=>{
    let searchValue ="";
    req.session.previousPage = req.originalUrl
    let arrayofStudents = await Student.find({})


    res.render("admin-dashboard",{name:req.session.name,totalStudents:arrayofStudents,searchValue:searchValue})
})
app.post("/admin-dashboard",async(req,res)=>{
    
  let arrayofStudents = await Student.find({})
    let searchValue;
  let emailOrNameOfStudent = req.body.emailOrNameOfStudent
  if(emailOrNameOfStudent){
      searchValue = await Student.find({
        
         $or: [
        { name: emailOrNameOfStudent  },
        { email: emailOrNameOfStudent }
      
    ]
})
    res.render("admin-dashboard",{name:req.session.name,totalStudents:arrayofStudents,searchValue:searchValue})
  } else {
    searchValue = await Student.find({})
        res.render("admin-dashboard",{name:req.session.name,totalStudents:arrayofStudents,searchValue:searchValue})

  }


})


app.get("/admin-students",async(req,res)=>{
    let searchValue
   
   
    let prevUrl = req.session.url
    let allStudents = await Student.find({})
    if(prevUrl == "/search" && req.session.searchWord){
       
       searchValue = await Student.find({
        
         $or: [
        { name: req.session.searchWord  },
        { email: req.session.searchWord }
      
    ]
    })
        console.log(searchValue);
        
    res.render("admin-students",{searchValue:searchValue,totalStudents:allStudents})
     } else {
          res.render("admin-students",{searchValue:searchValue,totalStudents:allStudents})
 
     }
})



app.post("/edit-student",async(req,res)=>{
let studentId = req.body.id
let findStudent = await Student.findOne({_id:studentId})
 req.session.studentObj = findStudent
 res.redirect("/edit-student")
})

app.get("/edit-student",(req,res)=>{
    let studentObj = req.session.studentObj
    
    console.log(studentObj);
    
    res.render("edit-student",{studentInfo:studentObj})
})

app.post("/update-student", async(req,res)=>{
    let studentID = req.body.studentID;
    let studentName = req.body.name;
    let studentEmail = req.body.email;
    let studentPassword = req.body.password;
    let studentCountry = req.body.country;
    let studentGender = req.body.gender;
    let studentWhatsapp = req.body.whatsapp;
    
    let studentUpdated = await Student.findByIdAndUpdate({_id:studentID},
        {
        name:studentName,
        email:studentEmail,
        country:studentCountry,
        gender:studentGender,
        whatsapp:studentWhatsapp,
        password:studentPassword
         },
        { new: true }
        )
        console.log(studentUpdated);
        
    res.render("edit-student",{studentInfo:studentUpdated})
})

app.post("/delete-student", async (req, res) => {

    let studentID = req.body.studentID;

    await Student.deleteOne({
        _id: studentID
    });

    res.redirect("/admin-students");
});

app.post("/admin-tasks",async(req,res)=>{
   let description = req.body.description
   let title = req.body.title.trim()
    let deadline = req.body.date
        
    if(req.body.target == "all"){
        await Student.updateMany({},{ 
            $push: {
                 tasks: {
                title: title,
                description: description,
                deadline:deadline,
                seen: false
            }
        }
            })
    } else {

        await Student.updateMany({
                
        _id: { $in: req.body.students }
                    },
            {
        $push: {
            tasks: {
                title: title,
                description: description,
                deadline:deadline,
                seen: false
            }
        }
    }
);
    }

res.redirect("/admin-tasks")
})

app.get("/admin-tasks",async(req,res)=>{
   
     let allStudents = await Student.find({})
    console.log(allStudents);
    
    res.render("admin-tasks",{allStudents:allStudents})
})

// app.get("/student-tasks",(req,res)=>{
   
     

    
//     res.render("student-tasks")
// })



app.post("/sent-task-back",async(req,res)=>{
let gitHubLink = req.body.gitHubLink
let taskID = req.body.taskID
let studentID = req.body.studentID
let titleTask = req.body.titleTask

    let submittedDate = new Date().toLocaleDateString("nl-NL")


await Student.updateOne(
    {
        _id: studentID,
        "tasks._id": taskID
    },
    {
        $set: {
            "tasks.$.githubLink": gitHubLink,
            "tasks.$.submitted": true,
            "tasks.$.submittedDay":submittedDate
        }
    }
);
res.redirect("/student-tasks/"+titleTask)
})




app.post("/admin-submissions",async(req,res)=>{
    let students = await Student.find({})
    let result = []
    students.forEach(student => student.tasks.filter(task =>{
        if(task.submitted){
            let obj = {student:student,task:task}
           result.push(obj)  
        }    
    }))
    let studentID = req.body.studentID
   
    
    let studentInfo = await Student.findOne({_id:studentID})
 console.log(studentInfo);
 
 

res.render("admin-submissions",{result:result,studentInfo:studentInfo})

})

app.get("/admin-submissions",async(req,res)=>{
   
    let students = await Student.find({})
 
    let result = []
    students.forEach(student => student.tasks.filter(task =>{
        if(task.submitted && task.taskEvaluation.length == 0){
            let obj = {student:student,task:task}
           result.push(obj)
            
        }
        
        
    }))
  
 

res.render("admin-submissions",{result:result,studentInfo:""})
   
});
    



  


    
  



app.post("/addNote", async (req, res) => {

   
let adminNote = req.body.adminNote
let taskId = req.body.taskId
let studentId = req.body.studentId
    await Student.updateOne(
        {
            _id: studentId,
            "tasks._id": taskId
        },
        {
            $set: {
                "tasks.$.taskEvaluation": adminNote
            }
        }
    );

   console.log(req.body.adminNote);
   console.log(req.body.studentId);
   console.log(req.body.taskId);

   res.redirect("/admin-submissions")
   
});


app.get("/admin-attendance", async(req,res)=>{

    let allStudents = await Student.find({})



    res.render("admin-attendance",{allStudents,arrayOfvalues:""})
})

app.post("/admin-attendance",async(req,res)=>{


let studentID = req.body.studentID
let LectureNumber = req.body.LectureNumber
let attendanceDate = req.body.attendanceDate
let present = req.body.present


console.log(studentID);
await Student.updateOne(
    { _id: studentID },
    {
        $push: {
            attendance: {
                LectureNumber: LectureNumber,
                present: present,
                attendanceDate: attendanceDate
            }
        }
    }
);


res.redirect("/admin-attendance")
})



app.post("/searchStudent",async(req,res)=>{
    let searchStudent = req.body.searchStudent;
    let allStudents = await Student.find({})
    let findStudent = await Student.findOne({})
     let searchValue = await Student.find({
        
         $or: [
        { name: searchStudent  },
        { email: searchStudent }
      
    ]
    })
    console.log(searchValue);

    res.render("admin-attendance",{allStudents,arrayOfvalues:searchValue})
    
})


app.get("/student-attendance",async(req,res)=>{
    let studentID = req.session.studentID
    
    let studentInfo = await Student.findOne({_id:studentID})
  
    studentInfo.attendance.forEach(day => {
        console.log(day.LectureNumber);
        
    })
    
    res.render("student-attendance",{studentInfo})
        
})

app.get("/student-rating",async(req,res)=>{
    let studentID = req.session.studentID
    
    let studentobj = await Student.findOne({_id:studentID})
    
    res.render("student-rating",{studentobj,wrong:null})
})
app.post("/student-rating",async(req,res)=>{
let studentName = req.body.studentName
let rating = req.body.rating
let comment = req.body.comment
let studentID = req.session.studentID
let studentInfo = await Student.findOne({_id:studentID})

if(studentInfo.gaveReview == false){
let newReview = new Review({
    name:studentName,
    rating:rating,
    comment:comment,
})

await newReview.save()
studentInfo.gaveReview = true
await studentInfo.save()
res.redirect("/student-dashboard")
} else {
    let studentID = req.session.studentID
    let studentobj = await Student.findOne({_id:studentID})
    let wrong = true
    res.render("student-rating",{studentobj,wrong})
}


})

//search request
app.post("/search",(req,res)=>{
    let searchWord = req.body.search
    req.session.searchWord = searchWord
    req.session.url = req.originalUrl
   
    res.redirect('/admin-students')
})
app.listen(3000,()=>{
    console.log("server is running");
    
})


//تحديد نوع التحيه للطالب
let date = new Date()
let getHours = date.getHours()
console.log(getHours);
if(getHours > 0 && getHours < 12){
    console.log("good morning");
    greeting = "صباح الخير 👋"
} else if(getHours > 12 && getHours < 18){
    console.log("good afternoon");
    greeting = "طاب يومك 👋"
} else {
    console.log("good evening");
    greeting = "مساء الخير 🌜"
}