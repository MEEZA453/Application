const express = require('express');
const app = express();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const cookie = require('cookie-parser');
let userModel = require('./model/user');
let postModel = require('./model/post')
const cookieParser = require('cookie-parser');
const { log } = require('console');
const multerConfig = require('./config/multerconfig')
app.set('view engine', 'ejs')
app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')))


app.get('/',(req , res)=>{
    res.render('index')
})
app.post('/', async(req , res)=>{
    let {username , name , age , email  , password} = req.body;
    bcrypt.genSalt(10,(err , salt)=>{
      bcrypt.hash(password , salt ,async(err,hash)=>{
          let user = await userModel.create({
         name , 
         username ,
         email,
         password : hash,    })
         console.log(user)   })
        
      let token = jwt.sign({email}, 'shhh')
      res.cookie('token' , token)
      res.render('login');
      })
})
app.get('/login',(req ,res)=>{
    res.render('login')
})
app.post('/login',async (req , res)=>{
  let {email} = req.body;

  let user =  await userModel.findOne({email :email})
  let token = jwt.sign({email}, 'shhh')
  res.cookie('token' , token);
if (!email) res.send('pls enter your email first')
  bcrypt.compare(req.body.password , user.password , function(err , result){
    if (result) return res.redirect('/profile')
else res.send('you can not login')})

})
app.get('/logout', (req , res)=>{
 res.cookie('token', '');
 res.redirect('/login');
})
app.get('/create',(req , res)=>{
  res.render('index')
} )

app.get('/profile',isLoggedIn ,async(req , res)=>{

let user = await userModel.findOne({email : req.user.email}).populate('posts');
  res.render('profile' , {user})
})




app.post('/post',isLoggedIn, async (req , res)=>{
  let {content} = req.body 
  let user = await userModel.findOne({email : req.user.email})
  let post =  await postModel.create({   
    user : user._id,
    content,
  
    })
    user.posts.push(post._id);
    await user.save();
    res.redirect('/profile')

})
app.get('/likes/:id', isLoggedIn,  async(req , res)=>{

let user = await userModel.findOne({email : req.user.email})
  let post = await postModel.findOne({_id: req.params.id}).populate('user');
  if (post.likes.indexOf(user.id) === -1){
    post.likes.push(user.id)
  }else{
    post.likes.splice(post.likes.indexOf(user.id), 1)
  }
  await post.save()
  res.redirect('/profile')

})
app.get('/profile/edit/:id',isLoggedIn, async(req , res)=>{
  let {userId} = req.params



  let post = await postModel.findOne({userId}).populate('user');
  console.log(post)
  res.render('edit' , {post} )
})
app.post('/profile/edit/:id',async(req , res)=>{
  let newcontent = req.body.content;
  let {userId} = req.params
  let post = await postModel.findOneAndUpdate({userId} , {content : newcontent});

  res.redirect('/profile')

})
app.get('/delete/:id', async(req , res)=>{
  await postModel.findOneAndDelete({_id:req.params.id})
  res.redirect('/profile')
})
app.get('/test', (req , res)=>{
  res.render('test')
})
app.post('/post',(req , res)=>{

})
  



function isLoggedIn(req  ,res , next){
  if(req.cookies.token ==='') res.render('login')
    else{ let deta = jwt.verify(req.cookies.token , 'shhh')
  req.user = deta
next()}
}


app.listen(3000);