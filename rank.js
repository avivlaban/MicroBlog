const epochTime = 1134028003;
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