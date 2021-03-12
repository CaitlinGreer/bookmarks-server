const express = require('express')
const { v4: uuid } = require('uuid')
const logger = require('../logger')
const bookmarks = require('../store')

const bookmarksRouter = express.Router()
const bodyParser = express.json()

bookmarksRouter
    .route('/bookmarks')
    .get((req, res) => {
        res
            .json(bookmarks)
    })

    .post(bodyParser, (req, res) => {
        const { title, url, description, rating } = req.body 

        if (!title) {
            logger.error(`Title is required`)
            return res
                .status(400)
                .send('Title is required')
        }
        if (!url) {
            logger.error(`url is required`)
            return res
                .status(400)
                .send('Url is required')
        }
        if (description.length < 1){
            logger.error(`Description is required`)
            return res
                .status(400)
                .send('Description must be at least 1 character')
        }
        if ((rating && rating < 1) || rating > 5) {
            logger.error(`Rating should be number between 1 and 5`)
            return res
                .status(400)
                .send('Rating should be a number between 1 and 5, if provided')
        }
    
        const id = uuid()
    
        const bookmark = {
            id,
            title,
            url,
            description,
            rating
        }
    
        bookmarks.push(bookmark)
    
        logger.info(`Bookmark with id ${id} created.`)
    
        res
            .status(201)
            .location(`http://localhost:8000/card/${id}`)
            .json(bookmark)
    })

    bookmarksRouter
        .route('/bookmarks/:id')
        .get((req, res) => {
            const { id } = req.params
            const bookmark = bookmarks.find(b => b.id == id)

        //validate a card was found
            if (!bookmark) {
                logger.error(`Bookmark with id ${id} not found.`)
                return res
                    .status(404)
                    .send('Bookmark Not Found')
            }
            res.json(bookmark)
        })
        .delete((req, res) => {
            const { id } = req.params

            const bookmarkIndex = bookmarks.findIndex( b => b.id == id)

            if (bookmarkIndex === -1) {
                logger.error(`Bookmark with id ${id} not found`)
                return res
                    .status(404)
                    .send('Bookmark Not found')
            }

            bookmarks.splice(bookmarkIndex, 1)

            logger.info(`Bookmark with id ${id} deleted`)

            res
                .status(204)
                .end()
        })
        

    module.exports = bookmarksRouter