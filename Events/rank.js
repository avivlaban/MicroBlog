const epochTime = 1134028003;

/**
 * Calculates a Post rank considering UpVotes, DownVotes and Creating time - Redis Algorithm
 * @param upVotesCounter - number of upvotes for this post
 * @param downVotesCounter - number of downvotes for this post
 * @param createTime - for this post
 * @return {number} - the rank as Integer
 */
function calculateRank(upVotesCounter, downVotesCounter, createTime){
    const voteDiff = upVotesCounter - downVotesCounter;
    const order = Math.log(Math.max(Math.abs(voteDiff), 1), 10);
    let sign;
    if(voteDiff > 0){
        sign = 1;
    }else if (voteDiff < 0) {
        sign = -1;
    }else{
        sign = 0;
    }
    const seconds = (createTime / 1000) - epochTime;
    const result = Math.round(sign * order + seconds / 45000, 7);
    return result;

}

exports.calculateRank = calculateRank;