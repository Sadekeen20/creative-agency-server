const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require("firebase-admin");
// const fileUpload = require('express-fileupload');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.luzew.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const app = express()

app.use(bodyParser.json());
app.use(cors());
// app.use(express.static('doctors'));
// app.use(fileUpload());

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
    const orderCollection = client.db("creativeagency").collection("orders");
    // const serviceCollection = client.db("doctorsPortal").collection("doctors");
    // console.log('connection established')

    app.post('/addOrder', (req, res) => {
        const order = req.body;
        orderCollection.insertOne(order)
            .then(result => {
                console.log(result)
                res.send(result.insertedCount > 0)
            })
    });

    //order dashboard content 
    app.get('/orders', (req, res) => {
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

    app.post('/appointmentsByDate', (req, res) => {
        const date = req.body;
        const email = req.body.email;
        serviceCollection.find({ email: email })
            .toArray((err, doctors) => {
                const filter = { date: date.date }
                if (doctors.length === 0) {
                    filter.email = email;
                }
                orderCollection.find(filter)
                    .toArray((err, documents) => {
                        console.log(email, date.date, doctors, documents)
                        res.send(documents);
                    })
            })
    })

    app.post('/addService', (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const email = req.body.email;
        const newImg = file.data;
        const encImg = newImg.toString('base64');

        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };

        serviceCollection.insertOne({ name, email, image })
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    app.get('/services', (req, res) => {
        serviceCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    });

    // app.post('/isDoctor', (req, res) => {
    //     const email = req.body.email;
    //     doctorCollection.find({ email: email })
    //         .toArray((err, doctors) => {
    //             res.send(doctors.length > 0);
    //         })
    // })

});

app.listen(port)