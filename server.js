require('dotenv').config()
const bcrypt = require('bcrypt');
var nodemailer = require('nodemailer');
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
    programmingLevel:String,
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
let arrayOfreviews = []
    let allReviews = await Review.find({})
    console.log(allReviews);
    allReviews.forEach(review =>{
        if(review.rating >= 5){
            arrayOfreviews.push(review)
        }
    })
    console.log(arrayOfreviews);
    
    
res.render("index",{wrong:"",totalStudents:totalStudents,arrayOfreviews})
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
    req.session.adminEmail = email
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
        req.session.id = user._id;
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
    let programmingLevel = req.body.programmingLevel
    
    
    let password = req.body.password
    const hashedPsw = await bcrypt.hash(password,12)

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
        programmingLevel:programmingLevel,
        whatsapp:whatsapp,
        password:hashedPsw,
        role:"student"
    })
    await newStudent.save()

// send email when user signed up
// =======================
console.log("APP_PASSWORD exists:", !!process.env.APP_PASSWORD);
console.log("APP_PASSWORD length:", process.env.APP_PASSWORD?.length);





var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mas.webdev24@gmail.com',
    pass: process.env.APP_PASSWORD
  }
});

const mailOptions = {
    from: "mas.webdev24@gmail.com",
    to: email,
    subject: "مرحبًا بك في الدورة 🎓",

    html: `<div style="
    font-family: Arial, Tahoma, sans-serif;
    direction: rtl;
    text-align: right;
    color: #333333;
    line-height: 1.9;
    max-width: 600px;
    margin: 0 auto;
    padding: 30px;
    background-color: #ffffff;
">

    <!-- الشعار -->
    <div style="
        text-align: center;
        margin-bottom: 30px;
    ">

        <img
            src="https://i.postimg.cc/jjyPp9nH/coding-logo.png"
            alt="Coding With MO"
            width="140"
            style="
                display: inline-block;
                max-width: 140px;
                height: auto;
            "
        >

    </div>


    <!-- العنوان -->
    <h1 style="
        color: #111111;
        font-size: 28px;
        text-align: center;
        margin: 0 0 30px;
    ">
        مرحبًا بك ${name} 👋
    </h1>


    <!-- النص -->
    <p style="
        font-size: 17px;
        margin: 0 0 18px;
    ">
        يسعدنا جدًا انضمامك إلى
        <strong style="color: #111111;">
            Coding With MO
        </strong>
        🎓💻
    </p>


    <p style="
        font-size: 16px;
        color: #555555;
        margin: 0 0 18px;
    ">
        تم تسجيلك في الدورة بنجاح،
        وأصبح حسابك جاهزًا للبدء في رحلتك التعليمية معنا.
    </p>


    <p style="
        font-size: 16px;
        color: #555555;
        margin: 0 0 18px;
    ">
        خلال الدورة ستتعلم خطوة بخطوة،
        وتطبق ما تتعلمه من خلال التمارين
        والمهام والمشاريع العملية 🚀
    </p>


    <p style="
        font-size: 16px;
        color: #555555;
        margin: 0 0 25px;
    ">
        نتمنى لك رحلة تعليمية ممتعة ومليئة بالإنجازات،
        ونتطلع إلى رؤية تطورك معنا ❤️
    </p>


    <!-- رسالة ترحيبية -->
    <div style="
        background-color: #f5f5f5;
        border-right: 4px solid #111111;
        padding: 15px 20px;
        margin: 25px 0;
        border-radius: 6px;
    ">

        <strong style="
            font-size: 16px;
            color: #111111;
        ">
            أهلًا بك مرة أخرى في Coding With MO! 💻
        </strong>

    </div>


    <!-- زر الدخول -->
    <div style="
        text-align: center;
        margin: 35px 0;
    ">

        <a
            href="https://front-end-course-03js.onrender.com/login"
            style="
                display: inline-block;
                background-color: #111111;
                color: #ffffff;
                text-decoration: none;
                padding: 13px 28px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: bold;
            "
        >
            الدخول إلى حسابي 🚀
        </a>

    </div>


    <!-- التوقيع -->
    <p style="
        font-size: 15px;
        color: #777777;
        margin-top: 30px;
    ">
        مع تحياتنا،
        <br>

        <strong style="color: #111111;">
            فريق Coding With MO 💻
        </strong>
    </p>

</div>
    `
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});
// =======================


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
    let adminInfo = await Student.findOne({_id:"6a9c924fc43053dfb519c925"})
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

app.get("/student-tasks/:titleID",check,async(req,res)=>{
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
    let adminEmail = req.session.adminEmail
   

    let adminInfo = await Student.findOne({email:adminEmail})

    let totaltasksFromAdmin = adminInfo.tasks.length
    console.log(totaltasksFromAdmin);
    
    


    res.render("admin-dashboard",{totaltasksFromAdmin,name:req.session.name,totalStudents:arrayofStudents,searchValue:searchValue})
})
app.post("/admin-dashboard",adminCheck,async(req,res)=>{
    
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


app.get("/admin-students",adminCheck,async(req,res)=>{
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

app.get("/edit-student",check,(req,res)=>{
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

app.get("/admin-tasks",adminCheck,async(req,res)=>{
   
     let allStudents = await Student.find({})
    console.log(allStudents);
    
    res.render("admin-tasks",{allStudents:allStudents})
})





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

app.get("/admin-submissions",adminCheck,async(req,res)=>{
   
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


app.get("/admin-attendance",adminCheck, async(req,res)=>{

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


app.get("/student-attendance",check,async(req,res)=>{
    let studentID = req.session.studentID
    
    let studentInfo = await Student.findOne({_id:studentID})
  
    studentInfo.attendance.forEach(day => {
        console.log(day.LectureNumber);
        
    })
    
    res.render("student-attendance",{studentInfo})
        
})

app.get("/student-rating",check,async(req,res)=>{
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