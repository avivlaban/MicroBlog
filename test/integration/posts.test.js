const request = require('supertest');
const data = require('./testsData')
const {Post} = require('../../models/post');
const {User} = require('../../models/user');
let server;
const welcomeMessage = "Hi, I'm your MicroBlog...";

let user1;
let post1;
let post2;
let post3;

describe('Integration Tests', () => {
    beforeAll(() => { server = require('../../index') });
    afterAll(() => { server.close() });

    describe('Make sure server is responsive', () => {

        describe('/', () => {
            it('Should return 200 ok with a welcome message', async () => {
                const res = await request(server).get('/api/posts/');
                expect(res.status).toBe(200);
                expect(res.body).toEqual({message: welcomeMessage});
            })

        });
    });
    describe('GET Posts', () => {
        beforeEach(async () => {
            //Create a user
            user1 = data.testUser1;
            user1 = new User(user1);
            user1 = await user1.save();

            // Create 3 posts with different ranks, titles and content
            post1 = data.topPostsTestPost1;
            post1.autor._id = user1._id;
            post1.autor.name = user1.name;
            post1 = await new Post(post1);
            post1 = post1.save();

            post2 = data.topPostsTestPost2;
            post2.autor._id = user1._id;
            post2.autor.name = user1.name;
            post2 = await new Post(post2);
            post2 = post2.save();

            post3 = data.topPostsTestPost3;
            post3.autor._id = user1._id;
            post3.autor.name = user1.name;
            post3 = await new Post(post3);
            post3 = post3.save();
        });
        afterEach(async () => {
            await User.remove({});
            await Post.remove({});
        });

        describe('/top - Check top results', () => {
            it('Get Top Posts Sorted in descending order', async () => {

                let res = await request(server).get('/api/posts/top');

                // Good response - 200
                expect(res.status).toBe(200);

                // Expect the 3rd object to have the following credentials
                expect(res.body[2]).toHaveProperty('title', 'Second Post Title');
                expect(res.body[2]).toHaveProperty('content', 'Second Post Content');

                // Make sure the objects are sorted by rank
                expect(res.body[0].rank).toBeGreaterThanOrEqual(res.body[1].rank);
                expect(res.body[1].rank).toBeGreaterThanOrEqual(res.body[2].rank);

                //Remove all posts and expect to get empty array and a 200 response
                await Post.remove({})
                res = await request(server).get('/api/posts/top');
                expect(res.status).toBe(200);
                expect(res.body).toEqual([]);
            })
        });
    });
});