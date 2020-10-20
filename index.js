const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require("firebase-admin");
const fileUpload = require('express-fileupload');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.luzew.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const app = express()




app.use(bodyParser.json());
app.use(cors());
app.use(express.static('services'));
app.use(fileUpload());

var serviceAccount = require("./sadekeen-marltj-firebase-adminsdk-eq8la-9d310c81b9.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB
});


const port = 5000;
app.get('/', (req, res) => {
    res.send("hello from db it's working")
})

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const orderCollection =client.db("creativeagency").collection("orders");
    const reviewCollection =client.db("creativeagency").collection("reviews");
    const adminCollection =client.db("creativeagency").collection("admins");
    const serviceCollection=client.db("creativeagency").collection("services");

    //post to site 
    app.post('/addOrder', (req, res) => {
        const order = req.body;
        console.log('working');
        orderCollection.insertOne(order)
            .then(result => {
                console.log(result)
                res.send(result.insertedCount > 0)
            })
    });
    console.log('ok1')
    // order dashboard content 
    app.get('/orderdashboard', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    if (tokenEmail == queryEmail) {
                        orderCollection.find({ email: queryEmail})
                            .toArray((err, documents) => {
                                res.status(200).send(documents);
                            })
                    }
                    else{
                        res.status(401).send('un-authorized access')
                    }
                }).catch(function (error) {
                    res.status(401).send('un-authorized access')
                });
        }
        else{
            res.status(401).send('un-authorized access')
        }
    })
    console.log('ok2')
    //post to site 
    app.post('/addReview', (req, res) => {
        const review = req.body;
        // console.log('working');
        reviewCollection.insertOne(review)
            .then(result => {
                console.log(result)
                res.send(result.insertedCount > 0)
            })
    });
    console.log('ok3')
     //show all review 
     app.get('/review',(req, res) => {
        reviewCollection.find({}).limit(3)
        .toArray((err,documents) => {
            res.send(documents)
        })
    })
    console.log('ok4')
    

    app.post('/addAService', (req, res) => {
        const file = req.files.file;
        const title = req.body.title;
        const description = req.body.description;
        const newImg = file.data;
        const encImg = newImg.toString('base64');

        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };

        serviceCollection.insertOne({ title, description, image })
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })
    console.log('ok5')
   

    app.patch("/updateStatus/:id",(req,res)=>{
            orderCollection.updateOne({_id:ObjectId(req.params.id)},
                {$set:{status:req.body.updatedStatus}})
                .then(result=>res.send(result.matchedCount>0))
        })
        console.log('ok6')
    


    app.post('/makeAdmin',(req,res)=>{     
        const email = req.body.email   
        adminCollection.insertOne({email:email})
        .then(result =>{ 
                res.send(result.insertedCount>0 )
        })                
    })   
    console.log('ok7')
    //show all review 
    app.get('/allOrder',(req, res) => {
        orderCollection.find({})
        .toArray((err,documents) => {
            res.send(documents)
        })
    })
    console.log('ok8')
    

    app.get('/services', (req, res) => {
        serviceCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    });

    app.post('/isAdmin', (req, res) => {
        const email = req.body.email;
        adminCollection.find({ email: email })
            .toArray((err, admins) => {
                res.send(admins.length > 0);
            })
    })
    console.log('ok9')
});



app.listen(process.env.PORT || port)