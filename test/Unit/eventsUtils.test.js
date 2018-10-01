const { calculateVotes, eventAction } = require('../../events/eventsUtils');
let downVoteList = [];
let upvoteList = [];
let votesArray = [{upVotes: upvoteList, downVotes: downVoteList}];

describe('Unit Tests for EventsUtils', () => {

    describe('Test the downVoteAction function', () => {
        beforeEach(() => {
            downVoteList = ['a', 'b', 'c'];
            upvoteList = ['d', 'e', 'f'];
            votesArray = [{upVotes: upvoteList, downVotes: downVoteList}];
        });

        it('Case 1: User did not Upvote or DownVote before', async () => {

            const result = await calculateVotes(eventAction.DOWNVOTE, votesArray, 'g', 'somePostId');

            expect(result[0].downVotes.length).toBe(4);
            expect(result[0].downVotes).toEqual(expect.arrayContaining(['a', 'b', 'c', 'g']));
            expect(result[0].upVotes.length).toBe(3);
            expect(result[0].upVotes).toEqual(expect.arrayContaining(['d', 'e', 'f']));
        });

        it('Case 2: User did not DownVote but UpVoted before', async () => {

            const result = await calculateVotes(eventAction.DOWNVOTE, votesArray, 'd', 'somePostId');

            expect(result[0].downVotes.length).toBe(4);
            expect(result[0].downVotes).toEqual(expect.arrayContaining(['a', 'b', 'c', 'd']));
            expect(result[0].upVotes.length).toBe(2);
            expect(result[0].upVotes).toEqual(expect.arrayContaining(['e', 'f']));
        });

        it('Case 3: User did DownVote but did not UpVote before', async () => {

            const result = await calculateVotes(eventAction.DOWNVOTE, votesArray, 'a', 'somePostId');

            expect(result[0].downVotes.length).toBe(3);
            expect(result[0].downVotes).toEqual(expect.arrayContaining(['a', 'b', 'c']));
            expect(result[0].upVotes.length).toBe(3);
            expect(result[0].upVotes).toEqual(expect.arrayContaining(['d', 'e', 'f']));
        });

        it('Case 4: User did DownVote and UpVote before - illegal: should return the same array', async () => {

            upvoteList = ['d', 'e', 'f', 'a'];
            votesArray = [{upVotes: upvoteList, downVotes: downVoteList}];

            const result = await calculateVotes(eventAction.DOWNVOTE, votesArray, 'a', 'somePostId');

            expect(result[0].downVotes.length).toBe(3);
            expect(result[0].downVotes).toEqual(expect.arrayContaining(['a', 'b', 'c']));
            expect(result[0].upVotes.length).toBe(4);
            expect(result[0].upVotes).toEqual(expect.arrayContaining(['d', 'e', 'f', 'a']));
        });

    });

});