
module.exports.testUser1 =
    {
        name: 'Test User 1',
        dateCreated: Date.now(),
        isActive: true
    };

module.exports.topPostsTestPost1 =
    {
        title: "First Post Title",
        autor: {
            _id: "id1",
            name: "name1"
        },
        rank: 500,
        votes: [{upVotes: [], downVotes: [], upVotesCount: 0, downVotesCount: 0}],
        dateCreated: Date.now(),
        dateUpdated: Date.now(),
        content: "First Post Title",
        isProcessed: false
    };
module.exports.topPostsTestPost2 =
    {
        title: "Second Post Title",
        autor: {
            _id: "id2",
            name: "name2"
        },
        rank: 300,
        votes: [{upVotes: [], downVotes: [], upVotesCount: 0, downVotesCount: 0}],
        dateCreated: Date.now(),
        dateUpdated: Date.now(),
        content: "Second Post Content",
        isProcessed: false
    };
module.exports.topPostsTestPost3 =
    {
        title: "Third Post Title",
        autor: {
            _id: "id3",
            name: "name3"
        },
        rank: 700,
        votes: [{upVotes: [], downVotes: [], upVotesCount: 0, downVotesCount: 0}],
        dateCreated: Date.now(),
        dateUpdated: Date.now(),
        content: "Third Post Title",
        isProcessed: false
    };