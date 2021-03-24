const path = require('path')
const express = require('express')
const xss = require('xss')
const { v4: uuid } = require('uuid')
const logger = require('../logger')
const store = require('../store')
const BookmarksService = require('./bookmarks-service')

const bookmarksRouter = express.Router()
const bodyParser = express.json()

const serializeBookmarks = bookmark => ({
    id: bookmark.id,
    title: xss(bookmark.title),
    url: bookmark.url,
    description: xss(bookmark.description),
    rating: Number(bookmark.rating)
  })

bookmarksRouter // /bookmarks route
  .route('/')

  .get((req, res, next) => { // GET
    BookmarksService.getAllBookmarks(req.app.get('db'))
      .then(bookmarks => {
        res.json(bookmarks.map(serializeBookmarks))
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
            .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
            .json(serializeBookmarks(bookmark))
        })
        .catch(next)
    })
 
bookmarksRouter
  .route('/:id')
    .all((req, res, next) => {
        BookmarksService.getById(
            req.app.get('db'),   
            req.params.id
    )
    .then(bookmark => {
        if(!bookmark) {
            return res.status(404).json({
              error: { message: `Bookmark doesn't exist` }
            })
        }
            res.bookmark = bookmark
              next()
        })
        .catch(next)
    })

    .get((req, res, next) => {
        res.json(serializeBookmarks(res.bookmark))
    })

    .delete((req, res, next) => {
        const { id } = req.params

    BookmarksService.deleteBookmark(
        req.app.get('db'),
            id
        )
        .then(() => {
            res.status(204).end()
        })
        .catch(next)
    })
    
    .patch(bodyParser, (req, res, next) => {
        const { title, url, description, rating } = req.body
        const bookmarkToUpdate = { title, url, description, rating }

        const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length
        if (numberOfValues === 0) {
          return res.status(400).json({
            error: {
              message: `Request body must contain either 'title', 'url', 'description' or 'rating'`
            }
          })
        }
        
        BookmarksService.updateBookmark(
          req.app.get('db'),
          req.params.id,
          bookmarkToUpdate
        )
          .then(numRowsAffected => {
            res.status(204).end()
          })
          .catch(next)
    })
        

module.exports = bookmarksRouter