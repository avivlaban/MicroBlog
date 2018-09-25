const mongoose = require('mongoose');
const SortedArray = require("sorted-array");
const {Post} = require('./models/post');
// Max number of posts to extract from DB
const maxPosts = 1000;

// Hash Table for posts <key,value> => <postId><Post>
let dict = [];

// Sorted Array structure => Sort by rank. Node contains postId also.
let sortedArray = new SortedArray([], sortForPostsByRank);

let updateList = [];


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

async function addPostToUpdateList(post){
    console.log("Before Debug Updated list: " + updateList);
    updateList.push(post);
    console.log("After Debug Updated list: " + updateList);
}

async function updateTopPosts(posts){
    let lastPost;
    posts.forEach(function(post) {
        sortedArray.insert({
            "rank": post.rank,
            "postId": post._id
        });
        dict[post._id] = post;
        lastPost = post;
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
    await removePost(post._id);
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

async function removePost(post){
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



