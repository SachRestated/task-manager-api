const express = require('express');
const { ObjectId } = require('mongodb');
const Task = require('../models/task');
const auth = require('../middleware/auth')

const router = new express.Router()

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    });

    try {
        // console.log(task)
        await task.save()
        res.status(201).send(task);
    }
    catch (e) {
        res.status(400).send(e)
    }


})

router.get('/tasks', auth, async (req, res) => {

    const match = {}
    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }
    const sort = {}
    // method1
    // const sortBy = {
    //     field: 'createdAt',
    //     isAscending: 1
    // } 
    if (req.query.sortBy) {
        const result = req.query.sortBy.split(':');
        // sortBy.field = result[0]
        // sortBy.isAscending = result[1] === 'asc' ? 1 : -1 
        //method1
        sort[result[0]] = result[1] === 'asc' ? 1 : -1
    }

    try {
        await req.user.populate({
            path: 'tasks', 
            match,
            options: {
                limit: parseInt(req.query.limit),  
                skip: parseInt(req.query.skip),
                sort
                //method1
                // sort: {
                //     [sortBy.field]: sortBy.isAscending
                // } 
            }
        }).execPopulate()
        res.send(req.user.tasks);
    } catch (e) {
        console.log(e)
        res.status(500).send()
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;

    try {
        const task = await Task.findOne({_id, owner: req.user._id })

        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    }
    catch (e) {
        res.status(500).send()
    }

})

router.patch('/tasks/:id', auth, async (req, res) => {
    const allowedUpdates = ['description', 'completed'];
    const updates = Object.keys(req.body);
    console.log(updates);
    let isValid = true;
    updates.forEach((update) => {
        isValid = isValid & allowedUpdates.includes(update);
    })

    if (!isValid) {
        return res.status(400).send({ error: 'Invalid update request!' });
    }
    try {
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        // http://mongoosejs.com/docs/middleware.html Please refer to the documentation. 
        //By design the middleware hook for remove is not fired for Model.remove, only for ModelDocument.remove function. 
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id})
        if (!task) return res.status(404).send()
        updates.forEach((update) => task[update] = req.body[update])

        await task.save()

        return res.send(task)

    } catch (e) {
        res.status(400).send()
    }

})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id});

        if (!task) return res.status(404).send();
        return res.send(task)
    } catch (e) {
        console.log(e)
        return res.status(500).send()
    }
})

module.exports = router