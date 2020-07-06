const express = require('express')
const app = express()

const basicAuth = (username = '', password = '', realm = 'protected') => (req, res, next) => {
  const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
  const [reqUsername, reqPassword] = Buffer.from(b64auth, 'base64').toString().split(':')

  if (username === reqUsername && password === reqPassword) {
    return next()
  }

  res.set('WWW-Authenticate', `Basic realm="${realm}"`)
  res.status(401).send('Authentication required.')
}

app.use(basicAuth(process.env.WEBHOOK_SECRET))

app.get('/', (req, res) => {
  res.send('you made it!')
})

app.listen(process.env.PORT || 3000)
