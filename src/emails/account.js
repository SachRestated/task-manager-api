const sgMail = require('@sendgrid/mail'); 

sgMail.setApiKey(`${process.env.SENDGRID_API_KEY}`)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email, 
        from: 'sachrestated@gmail.com',
        subject: 'Thanks for joining in',
        text: `Welcome to the app, ${name}. Let us know how you get along with the app`
    })
}


const sendExitEmail = (email, name) => {
    sgMail.send({
        to: email, 
        from: 'sachrestated@gmail.com',
        subject: 'Sad To See You Go',
        text:  `Goodbye, ${name}. We hope to see you come sometime soon.` 
    })
}

module.exports = {
    sendWelcomeEmail, 
    sendExitEmail
}
