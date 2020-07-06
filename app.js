const express = require('express')
const bodyParser = require('body-parser')
const {HttpClient} = require('@actions/http-client')
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

const createComment = async (params) => {
  const {repoToken, owner, repo, issueNumber, body} = params

  const http = new HttpClient('http-client-add-pr-comment-bot')

  const additionalHeaders = {
    accept: 'application/vnd.github.v3+json',
    authorization: `token ${repoToken}`,
  }

  return http.postJson(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
    {body},
    additionalHeaders,
  )
}

app.use(basicAuth(process.env.WEBHOOK_SECRET))
app.use(bodyParser.json())

app.post('/:owner/:repo/issues/:issueNumber/comments', async (req, res, next) => {
  try {
    // TEST FOR VALID TEMP TOKEN
    const temporaryGithubToken = req.header('Temporary-Github-Token')
    if (!temporaryGithubToken) {
      throw new Error('must provide a temporary github token')
    }

    const response = await createComment({
      ...req.params,
      body: req.body,
      repoToken: process.env.GITHUB_TOKEN,
    })

    res.status(200).send(response).end()
  } catch (err) {
    next(err)
  }
})

app.listen(process.env.PORT || 3000)
