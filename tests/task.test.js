const request = require('supertest')
const Task = require('../src/models/task')
const app = require('../src/app')
const mongoose = require('mongoose')
const {userOne, userOneId, setupDatabase, userTwo, taskOne} = require('./fixtures/db')

beforeEach(setupDatabase)

test('Should create a task for user', async () => {
    const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: 'Finish the breakfast',
        })
        .expect(201)

    const task = await Task.findById(response.body._id)
    // expect(task).not.toBeNull()
    // expect(task.completed).toEqual(false)

    
})

test('Should get the tasks for the given user', async () => {
    const response = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .expect(200)
    
    expect(response.body.length).toBe(2)
    
})

test('Should not allow one user to delete another user\'s tasks', async(done) => {

    const response = await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .send()
        .expect(404)
    
    const task = await Task.findById(taskOne._id)
    expect(task.description).toBe('first task')

    mongoose.connection.close()
    done()

})