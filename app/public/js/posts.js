let postList = document.getElementById('postsList');
// Function to load posts made by user who is currently logged in
async function loadPosts() {

    // Load posts data
    const post_response = await fetch("../json/posts.json");
    const post_data = await post_response.json();

    const login_response = await fetch("../json/login_attempt.json");
    const login_data = await login_response.json();

    
    fetch('query/getPosts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        // console.log(data)

        for (let i = 0; i < data.length; i++) {
            renderPosts(data[i].blgauth, data[i].blgdate, data[i].blgtitle, data[i].blgcont, data[i].blgid)
        }
    })
    // Remove current posts
    for(let i = 0; i < postList.children.length; i++) {
        if(postList.children[i].nodeName == "article") {
            postList.removeChild(postList.children[i]);
        }
    }

    // Add all recorded posts
    for(let i = 0; i < post_data.length; i++) {

        
    }
}

loadPosts();
function renderPosts(author, timestamp, title, content, postId) {

    let postContainer = document.createElement('article');
    postContainer.classList.add("post");
    let fig = document.createElement('figure');
    postContainer.appendChild(fig);

    let postIdContainer = document.createElement("p");
    postIdContainer.textContent = postId;
    postIdContainer.hidden = true;
    postId.id = "postId";
    postContainer.appendChild(postIdContainer);

    let img = document.createElement('img');
    let figcap = document.createElement('figcaption');
    fig.appendChild(img);
    fig.appendChild(figcap);
    
    let titleContainer = document.createElement('h3');
    titleContainer.textContent = title;
    figcap.appendChild(titleContainer);
    
    let usernameContainer = document.createElement('h5');
    usernameContainer.textContent = author;
    figcap.appendChild(usernameContainer);

    let timeContainer = document.createElement('h5');
    timeContainer.textContent = timestamp;
    figcap.appendChild(timeContainer);

    let contentContainer = document.createElement('p');
    contentContainer.textContent = content;
    figcap.appendChild(contentContainer);

    postList.insertBefore(postContainer, document.querySelectorAll("article")[0]);
}
// Function to filter posts on page using search bar
function searchPosts() {

    let searchBar = document.getElementById('search');

    // Get contents of search bar
    let filter = searchBar.value.toUpperCase();

    let postList = document.getElementById('postsList');
    let posts = postList.getElementsByTagName('article');

    // Loop through all posts, and hide ones that don't match the search
    for (i = 0; i < posts.length; i++) {

        // Search body of post
        let content = posts[i].getElementsByTagName('p')[0];
        let postContent = content.textContent || content.innerText;

        // Search title of post
        let title = posts[i].getElementsByTagName("h3")[0];
        let titleContent = title.textContent || title.innerText;

        // Search username of post
        let username = posts[i].getElementsByTagName("h5")[0];
        let usernameContent = username.textContent || username.innerText;

        // Change display property of post depending on if it matches search query
        if (postContent.toUpperCase().indexOf(filter) > -1 || titleContent.toUpperCase().indexOf(filter) > - 1 ||
             usernameContent.toUpperCase().indexOf(filter) > - 1) {
            posts[i].style.display = "";
        } else {
            posts[i].style.display = "none";
        }
    }
}

// Search posts whenever the user types
if(document.getElementById("search")) {
    document.getElementById("search").addEventListener("keyup", searchPosts);
}