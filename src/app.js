require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
const logger = require('./logger')
const bookmarksRouter = require('./bookmarks/bookmarks-router')
const BookmarksService = require('./bookmarks/bookmarks-service')

const app = express()
const jsonParser = express.json()

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';


app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())
app.use(express.json())

app.use(function validateBearerToken(req, res, next) {
    const apiToken = process.env.API_TOKEN
    const authToken = req.get('Authorization')

    if (!authToken || authToken.split(' ')[1] !== apiToken) {
        logger.error(`Unauthorized request to path: ${req.path}`)
        return res.status(401).json( { error: 'Unauthorized request' })
    }
    next()
})

app.use(bookmarksRouter)

app.post('/bookmarks', jsonParser, (req, res, next) => {
    const { title, url, description, rating } = req.body
    const newBookmark = { title, url, description, rating }   
    BookmarksService.insertBookmark(
        req.app.get('db'),
        newBookmark
    )
        .then(bookmark => {
            res 
                .status(201)
                .location(`/bookmarks/${bookmark.id}`)
                .json(bookmark)
        })
        .catch(next)
})


//Error handler middleware (hide error messages from users)
app.use(function errorHandler(error, req, res, next) {
    let response
    if (NODE_ENV === 'production') {
        response = { error: { message: 'server error' } }
    } else {
        console.error(error)
        response = { message: error.message, error }
    }
    res.status(500).json(response)
})

module.exports = app