const mongoose = require('mongoose');
const SortedArray = require("sorted-array");
const {Post} = require('./models/post');
// Number - #of posts from DB (maxPosts)
const maxPosts = 1000;

// Hash Table for posts <key,value> => <postId><Post>
var dict = [];

// Max Heap structure => Sort by rank. Node contains postId also.
var sortedArray = new SortedArray([], sortForPostsByRank);

var updateList = [];



// Constructorv
//  1. load for DB
//  2. loop function for every x time:
//

async function start(){
    const posts = await loadPostsFromDB();
    updateTopPosts(posts);
    setInterval(function() {
        if(updateList.length > 0){
            updateLists();
        }else{
            //Do nothing
            console.log("No update is needed");
        }
    }, 60 * 1000);
}

function updateTopPosts(posts){
    console.log("These are the posts: ", posts);
    let lastPost;
    posts.forEach(function(post) {
        console.log("Going over post:", post);
        sortedArray.insert({
            "rank": post.rank,
            "postId": post._id
        });
        dict[post._id] = post;
        lastPost = post;
    });
    console.log("Hash:", dict);
    console.log("Sorted Array:", sortedArray);

    console.log("Removing object");
    removePost(lastPost);
    console.log("Sorted Array:", sortedArray);
    console.log("Hash:", dict);
    console.log("Done");
}

function updateLists(){
    updateList.forEach(function(post) {
        console.log("Updating post:", post);
        updatePost(post);
    });
}

// load function(maxPosts) -> 1. Get from DB, 2. load posts to hash, 3. load posts.rank to Heap
async function loadPostsFromDB(){
    return await loadFromDb();

}

// Get x Posts:
// 1. if(x <= maxPosts) return x posts from this class
// 2. else get the new x posts from db (load functions)

// Update post in data structure
async function updatePost(post){
    await removePost(post._id);
    updateSortedList(post);
    updateDictionary(post);
}

// update post in sorted array
async function updateSortedList(post){
    sortedArray.insert({
        "rank": post.rank,
        "postId": post._id
    });
}

// update post in dictinary
async function updateDictionary(post){
    dict[post._id] = post;
}

// remove post from data structure
async function removePost(post){
    sortedArray.remove({"postId": post._id});
    delete dict[post._id];
}

// load all Posts from DB - by maxPosts
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

exports.start = start();




