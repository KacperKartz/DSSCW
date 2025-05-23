let postList = document.getElementById('myPosts');
// Function to load posts made by user who is currently logged in
async function loadPosts() {

    // Load posts data
    const post_response = await fetch("../json/posts.json");
    const post_data = await post_response.json();

    // Load login data
    const login_response = await fetch("../json/login_attempt.json");
    const login_data = await login_response.json();

    // Remove current posts

    for(let i = 0; i < postList.children.length; i++) {
        if(postList.children[i].nodeName == "article") {
            postList.removeChild(postList.children[i]);
        }
    }

    fetch('query/getMyPosts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data)

        for (let i = 0; i < data.length; i++) {
        // This is violently inefficient, but it should(TM) prevent SQL injection in the two free-form text fields on the make posts page. 
        // A more efficient way to do this would be to make a dictionary of all the characters we want to escape and then loop through it,
        // but this is easier to read and amend for now.
            var escapedTitle = data[i].blgtitle
            .replace(/'/g, "''")
            .replace(/"/g, '\\"')
            .replace(/\\/g, "\\\\")
            .replace(/</g, "&lt;") // Escape less than
            .replace(/>/g, "&gt;") // Escape greater than
            .replace(/&/g, "&amp;") // Escape ampersand
            .replace(/`/g, "&#96;") // Escape backtick

        var escapedContent = data[i].blgcont
            .replace(/'/g, "''")
            .replace(/"/g, '\\"')
            .replace(/\\/g, "\\\\")
            .replace(/</g, "&lt;") // Escape less than
            .replace(/>/g, "&gt;") // Escape greater than
            .replace(/&/g, "&amp;") // Escape ampersand
            .replace(/`/g, "&#96;") // Escape backtick

            console.log(escapedTitle, escapedContent); //DEBUGGING
            renderPosts(data[i].blgauth, data[i].blgdate, escapedTitle, escapedContent, data[i].blgid)
        }
    })
    
}

loadPosts();

function renderPosts(author, timestamp, title, content, postId) {
    let postContainer = document.createElement('article');
    postContainer.classList.add("post");
    let fig = document.createElement('figure');
    postContainer.appendChild(fig);

    let postIdContainer = document.createElement("h6");
    postIdContainer.textContent = postId;
    postIdContainer.hidden = true;
    postIdContainer.id = "postId";
    postContainer.appendChild(postIdContainer);

    let img = document.createElement('img');
    let figcap = document.createElement('figcaption');
    fig.appendChild(img);
    fig.appendChild(figcap);
    
    let titleContainer = document.createElement('h3');
    titleContainer.innerHTML = title;
    figcap.appendChild(titleContainer);
    
    let usernameContainer = document.createElement('h5');
    usernameContainer.textContent = author;
    figcap.appendChild(usernameContainer);

    let timeContainer = document.createElement('h5');
    timeContainer.textContent = timestamp;
    figcap.appendChild(timeContainer);

    let contentContainer = document.createElement('p');
    contentContainer.id = "content";
    contentContainer.innerHTML = content;
    figcap.appendChild(contentContainer);

    let editBtn = document.createElement('button');
    editBtn.classList.add('editBtn');
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", editPost);
    postContainer.appendChild(editBtn);

    let delBtn = document.createElement('button');
    delBtn.classList.add('delBtn');
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", deletePost);
    postContainer.appendChild(delBtn);

    postList.insertBefore(postContainer, document.querySelectorAll("article")[0]);
}
// Function to remove a post from the page after clicking delete - this is also reflected on the server side
async function deletePost(e) {

    // Put post in object to be the body of fetch request
    const post = {
        postId:document.getElementsByTagName('h6')[0].textContent, 
    };

    const requestHeaders = {
        "Content-Type": "application/json"
    };

    // Delete post
    const response = await fetch('/deletepost', {
        method: 'POST',
        headers: requestHeaders,
        body:JSON.stringify(post)
    });

    if(response.ok)
    {
        window.location.href = '/my_posts';
    }
}

// Function to edit post || pulls all the data into the form and then deletes that post
async function editPost(e) {

    // Get post that the user clicked on
    let post = e.target.parentNode;
   
    // Fill out form fields with data grabbed from post
    document.getElementById("title_field").value = post.getElementsByTagName('h3')[0].textContent;
    document.getElementById("content_field").value = post.getElementsByTagName('p')[0].textContent;
    document.getElementById("postId").value = post.getElementsByTagName('h6')[0].textContent;

    // Scroll user to post form
    document.getElementById("postForm").scrollIntoView({behavior: "smooth"});


    const blog = {
        postId:document.getElementsByTagName('h6')[0].textContent, 
    };

    const requestHeaders = {
        "Content-Type": "application/json"
    };

    await fetch('/deletepost', {
        method: 'POST',
        headers: requestHeaders,
        body:JSON.stringify(blog)
    });

}

// Function to filter posts on page using search bar
function searchPosts() {

    let searchBar = document.getElementById('search');

    // Get contents of search bar
    let filter = searchBar.value.toUpperCase();

    let postList = document.getElementById('myPosts');
    let posts = postList.getElementsByTagName('article');

    // Loop through all posts, and hide ones that don't match the search
    for (i = 0; i < posts.length; i++) {

        // Search body of post
        let content = posts[i].getElementsByTagName('p')[0];
        let postContent = content.textContent || content.innerText;

        // Search title of post
        let title = posts[i].getElementsByTagName("h3")[0];
        let titleContent = title.textContent || title.innerText;

        // Search username
        let username = posts[i].getElementsByTagName("h5")[0];
        let usernameContent = username.textContent || username.innerText;

        // Change display property of posts depending on whether it matches the search or not
        if (postContent.toUpperCase().indexOf(filter) > -1 || titleContent.toUpperCase().indexOf(filter) > - 1 ||
             usernameContent.toUpperCase().indexOf(filter) > - 1) {
            posts[i].style.display = "";
        } else {
            posts[i].style.display = "none";
        }
    }
}

document.getElementById("search").addEventListener("keyup", searchPosts);