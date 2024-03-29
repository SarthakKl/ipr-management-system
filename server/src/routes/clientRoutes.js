const router = require('express').Router()
const Client = require('../models/Client')
const jwt = require('jsonwebtoken')
const {S3Client, Type} = require('@aws-sdk/client-s3')
const multer = require('multer')
const multerS3 = require('multer-s3')
require('dotenv').config()
const Application = require('../models/Application')
const paymentController = require('../controllers/paymentController')

const accessKey = process.env.AWS_ACCESS_KEY_VALUE
const secretKey = process.env.AWS_SECRET_ACCESS_KEY_VALUE

const s3 = new S3Client({
    credentials:{
        accessKeyId: accessKey,
        secretAccessKey:secretKey
    },
    region:'us-east-1',
})

const upload = multer({
    storage:multerS3({
        s3:s3,
        bucket:'ipr-management-system-bucket',
        ACL:'public-read',
        metadata: function (req, file, cb) {
            cb(null, {fieldName: file.fieldname});
        },
        key: function (req, file, cb) {
            cb(null, Date.now() + "-" + file.originalname)
        },
        limits:{fileSize:2000000 } // In bytes: 2000000 bytes = 2 MB
    })
})
router.use( async (req, res, next) => {
    try {
        const token = req.headers.authorization || req.headers.Authorization
        const payload = await jwt.verify(token, process.env.CLIENT_JWT_SECRET)
        const client = await Client.findById(payload._id)
        console.log('In client routes' + payload, client)
        if(!client)
            return res.json({
                admin:"Client not found"
            })
        req.clientId = client._id;
        req.client = client
        next()
    } catch (error) {
        return res.json({
            error:error
        })
    }
})
const uploadFields = [{name:'idProof', maxCount:1}, 
                      {name:'content', maxCount:1}, 
                      {name:'form1', maxCount:1}, 
                      {name:'form3', maxCount:1}, 
                      {name:'form5', maxCount:1}, 
                      {name:'form48'}]

router.post('/apply', upload.fields(uploadFields), async (req, res) => {
    try {
        console.log(req.body)  
        const clientId = req.clientId
        const clientName = (await Client.findOne({_id:clientId})).fullname
        const title = req.body.title
        const idProof = req.files.idProof[0].location
        const content = req.body.docType == 'url'?req.body.content:req.files.content[0].location
        const description = req.body.desc
        const iprType = req.body.iprType
        let application_fee = 100000
        
        // const contentType = req.body.contentType
        console.log(clientName)
        let forms = []
        if(iprType == 'patent'){
            const form1 = req.files.form1[0].location
            const form3 = req.files.form3[0].location
            const form5 = req.files.form5[0].location
            application_fee = 200000
            forms = [form1, form3, form5];
        }
        if(iprType == 'trademark'){
            const form48 = req.files.form48[0].location
            application_fee = 150000       
            forms = [form48]
        }
        const applicationData = {
            client_id:clientId, 
            clientName:clientName,
            title: title, 
            id_proof: idProof, 
            content: content, 
            description: description,
            ipr_type: iprType, 
            forms: forms,
            application_fee
        }
        
        const application = new Application(applicationData)
        await application.save()

        return res.status(200).json({
            application,
            error:null,
            message:'Application saved successfully'
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message:error.message
        })
    }
})
router.get('/application-details', async (req, res) => {
    try {
        console.log("in application details")
        const selectedAttr = '_id title status description ipr_type createdAt payment_status'
        const allApplications = await Application.find({client_id:req.clientId})
                                                 .select(selectedAttr)
                                                 .sort({createdAt:-1})
        console.log(allApplications)
        const pending = allApplications.filter((application) => application.status == 'PENDING' && application.payment_status == 'PAID')
        const approved = allApplications.filter((application) => application.status == 'APPROVED')
        const rejected = allApplications.filter((application) => application.status == 'REJECTED')
        
        return res.status(200).json({
            applications:{
                pending,
                approved,
                rejected,
                allApplications
            },
            message:'Application details fetched',
            error:null
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            error:error.message
        })
    }
})
router.post('/create-order', paymentController.createOrder)
router.post('/verify-payment', paymentController.verifyPayment)
module.exports = router 