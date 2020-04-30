const mongoose = require("mongoose"),
    express = require("express"),
    { connectDB } = require('./dbconn'),
    app = express(),
    jwt = require('jsonwebtoken'),
    bcrypt = require('bcrypt'),
    cors = require('cors')

// APP CONFIG
connectDB()
app.use(express.json());

app.use(cors());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Change later to only allow our server
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// MONGOOSE/MODEL CONFIG

var userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});
var User = mongoose.model('User', userSchema);


var blogSchema = new mongoose.Schema({
    title: String,
    image: String,
    body: String,
    created: { type: Date, default: Date.now },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        username: String
    }
});
var Blog = mongoose.model("Blog", blogSchema);


let PORT =  process.env.PORT || 3001;

app.get('/', (req, res) => {
    res.send('Welcome to blogs app')
})

// INDEX ROUTE LIST ALL BLOGS
app.get('/blogs', async (req, res) => {
    try {
        const blogs = await Blog.find({});
        if (!blogs) return res.status(404).json({ err: 'no data found' })
        else {
            res.status(200).json({
                blogs
            })
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).json('Internal server error')
    }
})


// CREATE ROUTE
app.post("/blogs", auth, async (req, res) => {
    try {
        const blog = {
            author: {
                id: req.user.id,
                username: req.user.name
            },
            title: req.body.title,
            image: req.body.image,
            body: req.body.body
        }

        if (!blog.image.includes('https://')) {
            blog.image = 'https://theseabay.com/images/fallback.png'
        }
        // create blog
        const newBlog = await Blog.create(blog);
        if (!newBlog) return res.status(400).json({
            err: 'Something went wrong'
        })
        return res.status(200).json({ message: 'Successfully Created' })
    } catch (error) {
        console.log(error.message)
        res.status(500).json('Internal server error')
    }

});

// SHOW ROUTE
app.get("/blogs/:id", async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ err: 'No blog found' });
        res.status(200).json({
            blog: [blog]
        })
    } catch (error) {
        console.log(error.message)
        res.status(500).json('Internal server error')
    }

});

// EDIT ROUTE
// // UPDATE ROUTE
app.put("/blogs/:id", auth, async (req, res) => {
    try {
        const blog = await Blog.findByIdAndUpdate(req.params.id, req.body);
        if (blog) {
            return res.status(200).json({ message: 'Updated Successfully' })
        }
        return res.status(404).json({ err: 'post not found' })
    } catch (error) {
        console.log(error.message);
        res.status(500).json('Internal server error')
    }
});

// DELETE ROUTE
app.delete("/blogs/:id", auth, async (req, res) => {

    try {
        //destroy blog
        const blog = await Blog.findById(req.params.id)
        console.log(blog.author.id, req.user.id)

        if (blog) {
            if (blog.author.id.equals(req.user.id)) {
                await Blog.findByIdAndRemove(req.params.id)
                return res.status(200).json('successfully removed')
            }
            return res.status(404).json('something went wrong')
        }
    } catch (error) {
        console.error(error.message)
        res.status(500).json('internal server error')
    }

});

// //AUTH ROUTES

app.get('/userdetails', auth, async (req, res) => {
    try {
        res.status(200).json(req.user)
    } catch (error) {
        console.log(error.message)
        res.status(500).json('internal server error')
    }
})

app.post('/register', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (user) return res.status(400).json({ error: 'user already registred please sign in' });
        else {
            const user = {
                email: req.body.email,
                password: '',
                name: req.body.name
            }
            user.password = await bcrypt.hash(req.body.password, 10);

            const newUser = new User(user);
            const { id, name, email } = await newUser.save();
            const payload = {
                user: {
                    id,
                    name,
                    email
                }
            }
            var token = await jwt.sign(payload, 'secret');
            res.status(200).json({
                token
            })
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).json('internal server error')
    }
})

app.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(404).json({ err: 'No user found' });
        else {
            const userPass = await bcrypt.compare(req.body.password, user.password);
            if (!userPass) return res.json({ err: 'IVC' });

            const payload = {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            }
            var token = await jwt.sign(payload, 'secret');
            res.status(200).json({
                token
            })
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).json('internal server errror');
    }
})


app.get('/logout', function (req, res) {
    req.logout();
    res.status(200).json({
        message: 'logged out successfully'
    })
});

//MIDDLEWARE

function auth(req, res, next) {
    const token = req.header('x-auth-token');
    if (!token) return res.status(400).json({ err: 'No token found, authorisation failed' })
    try {
        const decoded = jwt.verify(token, 'secret')

        req.user = decoded.user;
        next();
    } catch (error) {
        return res.status(400).json({
            err: 'Invaild token'
        })
    }

}


app.listen(PORT, function () {
    console.log("SERVER IS RUNNING!");
});