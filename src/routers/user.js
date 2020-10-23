const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const {sendWelcomeEmail: welcome, sendExitEmail: exit} = require('../emails/account')
const router = new express.Router()


const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image file'))
        }
        cb(undefined, true)
       
    }
})

router.post('/users', async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save()
        const token = await user.generateAuthToken()
        welcome(user.email, user.name) 
        res.status(201).send({user, token})
    } catch (e) {
        // console.log(e);
        res.status(400).send(e)
    }

})

router.post('/users/me/avatar', auth, upload.single('upload'), async (req, res) => {

    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()

}, (error, req, res, next) => {
    res.status(400).send({
        error: error.message   
    })
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken()
        // res.send({ user, token })
        res.send({user, token})

    } catch (e) {
        res.status(400).send()
        
    }
})

router.post('/users/logout', auth, async(req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token)
        await req.user.save()

        res.send()

    } catch(e) {
        res.status(500).send()
    }
}) 

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()

        res.send()

    } catch (e) {
        res.status(500).send()
    }
}) 



router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)

})

router.get('/users/:id/avatar', async (req, res) => {

    try{
        const user = await User.findById(req.params.id)

        if(!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)

    } catch (e) {
        res.status(404).send()
    }

})

router.patch('/users/me', auth, async (req, res) => {
    const allowedUpdates = ['name', 'age', 'password', 'email'];
    const updates = Object.keys(req.body);

    let isValid = true;
    updates.forEach((update) => {
        isValid = isValid & allowedUpdates.includes(update.toLowerCase());
    })


    if (!isValid) {
        return res.status(400).send({ error: 'Not a valid update request' })
    }
    try {
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        // http://mongoosejs.com/docs/middleware.html Please refer to the documentation. 
        // By design the middleware hook for remove is not fired for Model.remove, only for ModelDocument.remove function. 

        updates.forEach((update) => {
            req.user[update] = req.body[update]
        })

        await req.user.save()
    
        res.send(req.user)
    }
    catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        // const user = await User.findByIdAndDelete(req.user._id);
        await req.user.remove()
        exit(req.user.email, req.user.name)
        return res.send(req.user)

    } catch (e) {
        
        return res.status(500).send()
    }
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
    
})


module.exports = router