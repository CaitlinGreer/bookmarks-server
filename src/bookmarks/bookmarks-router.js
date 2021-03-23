const express = require('express')
const { v4: uuid } = require('uuid')
const logger = require('../logger')
const store = require('../store')
const BookmarksService = require('./bookmarks-service')

const bookmarksRouter = express.Router()
const bodyParser = express.json()

bookmarksRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getAllBookmarks(knexInstance)
            .then(bookmarks => {
                res.json(bookmarks)
            })
            .catch(next)
    })

    .post(bodyParser, (req, res, next) => {
        for (const field of ['title', 'url', 'rating']) {
            if(!req.body[field]) {
                logger.error(`'${field}' is required`)
                return res.status(400).send({
                    error: { message: `'${field}' is required` }
                })
            }
        }
              
        const { title, url, description, rating } = req.body

        const ratingNum = Number(rating)

        if(!Number.isInteger(ratingNum) || ratingNum > 5 || ratingNum < 0) {
            logger.error(`Invalid rating '${rating}' supplied`)
            return res.status(400).send({
                error: { message: `'rating' must be a number between 0 and 5`}
            })
        }

           const newBookmark = { title, url, description, rating }   

        if(!title) {
            return res.status(400).json({
                error: { message: `Missing 'title' in request body` }
            })
        }

        if(!url) {
            return res.status(400).json({
                error: { message: `Missing 'url' in request body` }
            })
        }

        if(!rating) {

        }

        BookmarksService.insertBookmark(
            req.app.get('db'),
            newBookmark
            )
            .then(bookmark => {
                res
                  .status(201)
                  .json(bookmark)
            })
            .catch(next)
        })


bookmarksRouter
        .route('/bookmarks/:id')
        .get((req, res, next) => {
            const knexInstance = req.app.get('db')
            BookmarksService.getById(knexInstance, req.params.id)
                .then(bookmark=> {
                    if (!bookmark) {
                        return res.status(404).json({
                            error: { message: `Bookmark doesn't exist` }
                        })
                    }
                    res.json(bookmark)
                })
                .catch(next)
        })


        .delete((req, res) => {
            const { id } = req.params

            const bookmarkIndex = store.bookmarks.findIndex( b => b.id == id)

            if (bookmarkIndex === -1) {
                logger.error(`Bookmark with id ${id} not found`)
                return res
                    .status(404)
                    .send('Bookmark Not found')
            }

            store.bookmarks.splice(bookmarkIndex, 1)

            logger.info(`Bookmark with id ${id} deleted`)

            res
                .status(204)
                .end()
        })
        

    module.exports = bookmarksRouter