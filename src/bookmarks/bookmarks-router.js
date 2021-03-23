const express = require('express')
const { v4: uuid } = require('uuid')
const logger = require('../logger')
const store = require('../store')
const BookmarksService = require('./bookmarks-service')

const bookmarksRouter = express.Router()
const bodyParser = express.json()

bookmarksRouter // /bookmarks route
  .route('/')

  .get((req, res, next) => { // GET
    BookmarksService.getAllBookmarks(req.app.get('db'))
      .then(bookmarks => {
        res.json(bookmarks)
      })
      .catch(next)
  })

  .post(bodyParser, (req, res, next) => { // POST
    const { title, url, description, rating } = req.body
    const newBookmark = { title, url, description, rating }

    for (const [key, value] of Object.entries(newBookmark))
      if (value == null)
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        })
      
      const ratingNum = Number(rating)

      if(!Number.isInteger(ratingNum) || ratingNum > 5 || ratingNum < 0) {
            logger.error(`Invalid rating '${rating}' supplied`)
            return res.status(400).send({
                error: { message: `'rating' must be a number between 0 and 5`}
            })
        }
      
    BookmarksService.insertBookmark(
        req.app.get('db'),
        newBookmark
      )
        .then(bookmark => {
          logger.info(`Bookmark with id ${bookmark.id} created`)
          res
            .status(201)
            .location(`/bookmarks/${bookmark.id}`)
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