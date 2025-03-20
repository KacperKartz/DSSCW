// Function to add the latest 2 posts to the home page
async function loadLatestPosts() {

    // Load posts data
    const post_response = await fetch("../json/posts.json");
    const post_data = await post_response.json();

    const login_response = await fetch("../json/login_attempt.json");
    const login_data = await login_response.json();

    // Remove current posts from page
    let postList = document.getElementById('postsList');

    for(let i = 0; i < postList.children.length; i++) {
        if(postList.children[i].nodeName == "article") {
            postList.removeChild(postList.children[i]);
        }
    }

    // Load latest 2 posts
    for(let i = post_data.length - 1; i > post_data.length - 3; i--) {
        let author = post_data[i].username;
        let timestamp = post_data[i].timestamp;
        let title = post_data[i].title;
        let content = post_data[i].content;
        let postId = post_data[i].postId;

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

        postList.insertBefore(postContainer, postList.querySelectorAll("section > p")[1]);
    }
}

loadLatestPosts();