const mongoose = require('mongoose');
const SortedArray = require("sorted-array");
const {Post} = require('./models/post');
const winston = require('winston');

// Max number of posts to extract from DB
const maxPosts = 5;
// Holds the lowest rank in the sorted-array
var lowestRank = -1;
// Holds the time interval for checking new updets in seconds
const timeOutForNewPostsCheck = 10

// Hash Table for posts <key,value> => <postId><Post>
var dict = [];

// Sorted Array structure => Sorted by rank. Each item contains postId also.
var sortedArray = new SortedArray([], sortForPostsByRank);

// An array that holds all new posts to update
var updateList = [];

// Loads ${maxPosts} posts from DB and sorting it out descending
// Also checks every ${timeOutForNewPostsCheck} for new updates and if found updates it
async function start(){
    // load posts from DB
    const posts = await loadPostsFromDB();
    // Update the selected posts in this class sorted-array and hash-table
    updateTopPosts(posts);
    // Update the current lowest rank for posts
    updateLowestRank();
    // Runs every ${timeOutForNewPostsCheck} seconds and check for updates
    setInterval(function() {
        if(updateList.length > 0){
            winston.log('Updating Top Posts');
            updateLists();
        }
    }, timeOutForNewPostsCheck * 1000);
}

// Updates the lowest rank available in the Top results list
function updateLowestRank(){
    if(sortedArray.array.length > 0){
        lowestRank = sortedArray.array[sortedArray.array.length - 1].rank;
        winston.log("lowest rank updated to: " + lowestRank);
    }
}

// Add a given post to the updateList, waiting to be updated
async function addPostToUpdateList(post){
    if(post.rank >= lowestRank) {
        if(sortedArray.array.length >= maxPosts){
            const postIdToRemove = sortedArray.array[sortedArray.array.length - 1].postId;
            const postToRemove = dict[postIdToRemove];
            console.log('Post to remove: ' + postToRemove);
            updateLowestRank();
            if(dict[post._id]) {
                removePost(postToRemove);
            }
        }
        await updateList.push(post);
    }else{
        console.log("Item shoud not be updated");
    }
    console.log("After Debug Updated list: " + updateList);
}

async function updateTopPosts(posts){
    let lastPost;
    let count = 0;
    posts.forEach(function(post) {
        if(count < maxPosts) {
            sortedArray.insert({
                "rank": post.rank,
                "postId": post._id
            });
            dict[post._id] = post;
            lastPost = post;
        }
    });
}

async function updateLists(){
    while(updateList.length > 0){
        const item = updateList.pop();
        console.log("Updating post:", item);
        updatePost(item);
    }
}

async function getTopPosts(numberOfPosts){
    if(numberOfPosts > maxPosts){
        numberOfPosts = maxPosts;
    }
    let resultList = [];
    console.log("Sorted Array is now: " + sortedArray.array.length);
    if(numberOfPosts < sortedArray.array.length){
        for(i = 0; i < numberOfPosts; i++){
            const postId = sortedArray.array[i].postId;
            const post = dict[postId];
            resultList.push(post);
        }
        return resultList;
    }else{
        for(i = 0; i < sortedArray.array.length; i++){
            const postId = sortedArray.array[i].postId;
            const post = dict[postId];
            resultList.push(post);
        }
        return await resultList;
    }
}

async function loadPostsFromDB(){
    return await loadFromDb();

}

async function updatePost(post){
    console.log("Before remove: " + sortedArray.array.length);
    if(dict[post.id]) {
        removePost(post._id);
    }
    updateSortedList(post);
    updateDictionary(post);
}

async function updateSortedList(post){
    sortedArray.insert({
        "rank": post.rank,
        "postId": post._id
    });
}

async function updateDictionary(post){
    dict[post._id] = post;
}

async function removePost(post) {
    sortedArray.remove({"postId": post._id});

    delete dict[post._id];

}

function sortForPostsByRank(a,b){
    if (a.rank < b.rank)
        return 1;
    if (a.rank > b.rank)
        return -1;
    return 0;
}

async function loadFromDb(){
    return await Post.find().sort({ rank: 1}).limit(maxPosts);
}

exports.init = async () => {
    await start();
}

exports.getTopPosts = async (numberOfPosts) => {
    return await getTopPosts(numberOfPosts);
}

exports.addPostToUpdateList = async (post) => {
    return await addPostToUpdateList(post);
}



