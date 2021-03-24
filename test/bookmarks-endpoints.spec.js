const { expect } = require('chai')
const knex = require('knex')
const supertest = require('supertest')
const app = require('../src/app')
const { makeBookmarksArray, makeMaliciousBookmark } = require('./bookmarks-fixtures')

describe('Bookmarks Endpoints', function () {
    let db

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('bookmarks').truncate())

    afterEach('cleanup', () => db('bookmarks').truncate())

//GET /api/bookmarks
    describe(`GET /api/bookmarks`, () => {
        context ('Given no bookmarks', () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                .get('/api/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200, [])
            })
        })
        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
                return db
                .into('bookmarks')
                .insert(testBookmarks)
            })

            it('GET /api/bookmarks responds with 200 and all of the bookmarks', () => {
                return supertest(app)
                    .get('/api/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, testBookmarks)
            })
        })

        context(`Given an XSS attack bookmark`, () => {
            const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark()

            beforeEach('insert malicious bookmark', () => {
                return db
                    .into('bookmarks')
                    .insert([maliciousBookmark])
            })

                it('removes XSS attack content', () => {
                    return supertest(app)
                        .get(`/api/bookmarks`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(200)
                        .expect(res => {
                            expect(res.body[0].title).to.eql(expectedBookmark.title)
                            expect(res.body[0].description).to.eql(expectedBookmark.description)
                        })
                })
            })
        })
    

//GET /:id
    describe(`GET /api/bookmarks/:id`, () => {
        context(`Given no bookmarks`,  () => {
            it(`responds with 404`, () => {
                const bookmarkId = 12345
                return supertest(app)
                    .get(`/api/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { error: { message: `Bookmark doesn't exist` }})
            })
        })

        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })
        
            it ('it responds with 200 and the specified bookmark', () => {
            const bookmarkId = 2
            const expectedBookmark = testBookmarks[bookmarkId - 1]
            return supertest(app)
                .get(`/api/bookmarks/${bookmarkId}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200, expectedBookmark)
            })
        })
        context(`Given an XSS attack bookmark`, () => {
            const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark()

            beforeEach('insert malicious bookmark', () => {
                return db
                    .into('bookmarks')
                    .insert([maliciousBookmark])
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/bookmarks/${maliciousBookmark.id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql(expectedBookmark.title)
                        expect(res.body.description).to.eql(expectedBookmark.description)
                    })
            })
        })
    })

//POST
    describe(`POST /api/bookmarks`, () => {
        it('creates a bookmark, responding with 201 and the new bookmark', () => {
            const newBookmark = {
                title: 'Test New Bookmark',
                url: 'www.test-url.com',
                description: 'Test new description...',
                rating: 1
                }
            return supertest(app)
                .post('/api/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send(newBookmark)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(newBookmark.title)
                    expect(res.body.url).to.eql(newBookmark.url)
                    expect(res.body.description).to.eql(newBookmark.description)
                    expect(res.body.rating).to.eql(newBookmark.rating)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`)
                })
                .then(res => 
                    supertest(app)
                    .get(`/api/bookmarks/${res.body.id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(res.body)
                )
        })
        it(`responds with 400 and an error message when the 'title' is missing`, () => {
            return supertest(app)
                .post('/api/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send({
                    url: 'www.test-url.com',
                    description: 'Test new description...',
                    rating: 1,
                })
                .expect(400, {
                    error: { message: `Missing 'title' in request body` }
                })
        })
        it(`responds with 400 and an error message when the 'url' is missing`, () => {
            return supertest(app)
                .post('/api/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send({
                    title: 'Test New Bookmark',
                    description: 'Test new description...',
                    rating: 1,
                })
                .expect(400, {
                    error: { message: `Missing 'url' in request body` }
                })
        })
        it(`responds with 400 and an error message when the 'rating' is missing`, () => {
            return supertest(app)
                .post('/api/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send({
                    title: 'Test New Bookmark',
                    description: 'Test new description...',
                    url: 'www.test-url.com'
                })
                .expect(400, {
                    error: { message: `Missing 'rating' in request body` }
                })
        })
        it(`responds with 400 and an error message if 'rating' is not between 0 and 5`, () => {
            return supertest(app)
                .post('/api/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send({
                    title: 'Test New Bookmark',
                    url: 'www.test-url.com',
                    description: 'Test new description...',
                    rating: 'invalid',
                })
        })
    
        it('removes XSS attack from response', () => {
            const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark()
            return supertest(app)
                .post(`/api/bookmarks`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send(maliciousBookmark)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(expectedBookmark.title)
                    expect(res.body.description).to.eql(expectedBookmark.description)
                })
        })
    })

//DELETE /api/bookmarks/:id
    describe(`DELETE /api/bookmarks/:id`, () => {
        context('Given no bookmark', () => {
            it('responds with 404', () =>{
                const bookmarkId = 123456
                return supertest(app)
                    .delete(`/api/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { error: { message: `Bookmark doesn't exist` }})
            })
        })

        context('Given there are articles in the database', () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert articles', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it('responds with 204 and removes the article', () => {
                const idToRemove = 2
                const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)
                return supertest(app)
                    .delete(`/api/bookmarks/${idToRemove}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get('/api/bookmarks')
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedBookmarks)
                    )
            })
        })
    })

//PATCH /api/bookmarks/:id
    describe.only(`PATCH /api/bookmarks/:id`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 404`, () => {
                const bookmarkId = 123456
                return supertest(app)
                    .patch(`/api/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { error: { message: `Bookmark doesn't exist` } })
            })
        })
        context(`Given there are articles in the database`, () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
                return db  
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it(`responds with 204 and updates the bookmark`, () => {
                const idToUpdate = 2
                const updateBookmark = {
                    title: 'updated bookmark title',
                    url: 'www.updated-url.com',
                    description: 'Updated description...',
                    rating: 2,
                }
                const expectedBookmark = {
                    ...testBookmarks[idToUpdate - 1],
                    ...updateBookmark
                }
                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(updateBookmark)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/bookmarks/${idToUpdate}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)                        
                            .expect(expectedBookmark)
                    )
            })

            it(`responds with 400 when no required fields supplied`, () => {
                const idToUpdate = 2
                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send({ irrelivantField: 'foo ' })
                    .expect(400, {
                        error: {
                            message: `Request body must contain either 'title', 'url', 'description' or 'rating'`
                        }
                    })
            })

            it(`responds with 204 when updating only a subset of fields`, () => {
                const idToUpdate = 2
                const updateBookmark = {
                    title: 'update bookmark title',
                }
                const expectedBookmark = {
                    ...testBookmarks[idToUpdate - 1],
                    ...updateBookmark
                }

                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send({
                        ...updateBookmark,
                        fieldToIgnore: 'should not be in GET response'
                    })
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/bookmarks/${idToUpdate}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)    
                            .expect(expectedBookmark)
                    )

            })
        })
    })
})
