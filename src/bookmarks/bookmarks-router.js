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


ookmarksRouter
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