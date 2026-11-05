/* =====================================
   DESHI VIDEO WEBSITE
===================================== */

const OWNER = "arya250";
const REPO = "Deshi";
const BRANCH = "main";

const RAW_BASE =
`https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`;

const API_BASE =
`https://api.github.com/repos/${OWNER}/${REPO}/contents/thumbnails?ref=${BRANCH}`;


let videos = [];

let selectedVideo = null;

let isPlaying = false;


/* =====================================
   LOAD VIDEOS
===================================== */

async function loadVideos() {

    const grid = document.getElementById("videoGrid");

    try {

        const response = await fetch(API_BASE);

        if (!response.ok) {

            throw new Error("GitHub API request failed");

        }

        const files = await response.json();

        if (!Array.isArray(files)) {

            throw new Error("Invalid GitHub response");

        }


        videos = [];

        for (const file of files) {

            const match = file.name.match(
                /^thumbnail(\d+)\.(jpg|jpeg|png|webp)$/i
            );

            if (!match) continue;

            const id = match[1];

            videos.push({

                id: id,

                title: `Video ${id}`,

                thumbnail:
                `thumbnails/${file.name}`,

                video:
                `videos/video${id}.mp4`

            });

        }


        videos.sort((a,b) => Number(a.id) - Number(b.id));


        renderVideos();

    }

    catch(error) {

        console.error(error);

        grid.innerHTML = `
            <div class="loading-card">
                Unable to load videos.
                Please try again later.
            </div>
        `;

    }

}


/* =====================================
   RENDER HOME VIDEOS
===================================== */

function renderVideos() {

    const grid = document.getElementById("videoGrid");

    grid.innerHTML = "";

    document.getElementById("countBadge").textContent =
        videos.length;

    document.getElementById("videoCount").textContent =
        `${videos.length} videos available`;


    if (videos.length === 0) {

        grid.innerHTML = `
            <div class="loading-card">
                No videos available.
            </div>
        `;

        return;

    }


    videos.forEach((video,index) => {

        const card = document.createElement("article");

        card.className = "video-card";

        card.style.animationDelay = `${index * 40}ms`;


        const thumbnail = document.createElement("div");

        thumbnail.className = "thumbnail";


        const image = document.createElement("img");

        image.src = video.thumbnail;

        image.alt = "";

        image.loading = "lazy";

        image.onerror = () => {

            image.style.opacity = "0";

        };


        thumbnail.appendChild(image);

        card.appendChild(thumbnail);


        card.addEventListener("click",() => {

            openVideo(video);

        });


        grid.appendChild(card);

    });

}


/* =====================================
   OPEN VIDEO DETAILS
===================================== */

function openVideo(video) {

    selectedVideo = video;

    isPlaying = false;


    stopPlayer();


    document.getElementById("homePage")
        .classList.add("hidden");


    document.getElementById("detailsPage")
        .classList.remove("hidden");


    document.getElementById("detailThumbnail").src =
        video.thumbnail;


    document.getElementById("detailTitle").textContent =
        video.title;


    document.getElementById("detailDate").textContent =
        "Recently added";


    document.getElementById("playerContainer")
        .classList.add("hidden");


    document.getElementById("loadingOverlay")
        .classList.add("hidden");


    renderSuggested(video.id);


    history.pushState(
        {video: video.id},
        "",
        `?video=${video.id}`
    );


    window.scrollTo(0,0);

}


/* =====================================
   STOP PLAYER
===================================== */

function stopPlayer() {

    const player = document.getElementById("videoPlayer");

    player.pause();

    player.removeAttribute("src");

    player.load();

}


/* =====================================
   PLAY VIDEO
===================================== */

function playVideo() {

    if (!selectedVideo || isPlaying) return;

    isPlaying = true;


    const overlay =
        document.getElementById("loadingOverlay");


    overlay.classList.remove("hidden");


    const player =
        document.getElementById("videoPlayer");


    const videoUrl =
        `${RAW_BASE}/${selectedVideo.video}`;


    player.src = videoUrl;


    player.oncanplay = async () => {

        overlay.classList.add("hidden");

        document.getElementById("playerContainer")
            .classList.remove("hidden");

        try {

            await player.play();

        }

        catch(error) {

            console.log("Playback requires user interaction.");

        }

    };


    player.onerror = () => {

        overlay.classList.add("hidden");

        isPlaying = false;

        alert(
            "Unable to play this video. Please check whether the MP4 file exists in the GitHub videos folder."
        );

        stopPlayer();

    };


    player.load();

}


/* =====================================
   BACK BUTTON
===================================== */

function goBack() {

    stopPlayer();

    selectedVideo = null;

    isPlaying = false;


    document.getElementById("detailsPage")
        .classList.add("hidden");


    document.getElementById("homePage")
        .classList.remove("hidden");


    history.pushState(
        {},
        "",
        window.location.pathname
    );


    window.scrollTo(0,0);

}


/* =====================================
   SUGGESTED VIDEOS
===================================== */

function renderSuggested(currentId) {

    const grid =
        document.getElementById("suggestedGrid");

    grid.innerHTML = "";


    const suggested = videos
        .filter(v => v.id !== currentId)
        .slice(0,6);


    suggested.forEach(video => {

        const card = document.createElement("div");

        card.className = "suggested-card";


        const image = document.createElement("img");

        image.src = video.thumbnail;

        image.alt = "";

        image.loading = "lazy";


        card.appendChild(image);


        card.onclick = () => {

            openVideo(video);

            window.scrollTo(0,0);

        };


        grid.appendChild(card);

    });

}


/* =====================================
   SHARE VIDEO LINK
===================================== */

async function shareVideo() {

    if (!selectedVideo) return;


    const url =
        `${window.location.origin}${window.location.pathname}?video=${selectedVideo.id}`;


    if (navigator.share) {

        try {

            await navigator.share({

                title: "DESHI Video",

                text: "Watch this video on DESHI.",

                url: url

            });

            return;

        }

        catch(error) {

            if (error.name === "AbortError") return;

        }

    }


    try {

        await navigator.clipboard.writeText(url);

        alert("Video link copied successfully!");

    }

    catch(error) {

        prompt("Copy video link:",url);

    }

}


/* =====================================
   DIRECT SHARED VIDEO LINK
===================================== */

function checkSharedLink() {

    const params =
        new URLSearchParams(window.location.search);

    const id = params.get("video");


    if (!id || !/^\d+$/.test(id)) return;


    const video = videos.find(v => v.id === id);


    if (video) {

        openVideo(video);

    }

}


/* =====================================
   BROWSER BACK BUTTON
===================================== */

window.addEventListener("popstate",() => {

    const id =
        new URLSearchParams(location.search).get("video");


    if (id) {

        const video = videos.find(v => v.id === id);

        if (video) {

            openVideo(video);

        }

    }

    else {

        stopPlayer();

        selectedVideo = null;

        document.getElementById("detailsPage")
            .classList.add("hidden");

        document.getElementById("homePage")
            .classList.remove("hidden");

    }

});


/* =====================================
   INITIALIZE
===================================== */

document.addEventListener("DOMContentLoaded",async () => {

    await loadVideos();

    checkSharedLink();

});
