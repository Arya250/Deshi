// DESHI CONFIGURATION

const OWNER = "arya250";
const REPO = "Deshi";
const BRANCH = "main";

let videos = [];
let selectedVideo = null;


// LOAD VIDEOS AUTOMATICALLY FROM GITHUB

async function loadVideos() {

    const grid = document.getElementById("videoGrid");

    try {

        const api =
        `https://api.github.com/repos/${OWNER}/${REPO}/contents/thumbnails?ref=${BRANCH}`;

        const response = await fetch(api);

        if (!response.ok) {
            throw new Error("Unable to load thumbnails");
        }

        const files = await response.json();

        const thumbnails = files.filter(file =>
            /^thumbnail\d+\.(jpg|jpeg|png|webp)$/i.test(file.name)
        );

        videos = [];

        for (const file of thumbnails) {

            const match = file.name.match(/\d+/);

            if (!match) continue;

            const number = match[0];

            videos.push({
                id: number,
                title: `Video ${number}`,
                thumbnail: `thumbnails/${file.name}`,
                video: `videos/video${number}.mp4`
            });

        }

        videos.sort((a, b) => Number(a.id) - Number(b.id));

        grid.innerHTML = "";

        videos.forEach(video => {

            const card = document.createElement("article");

            card.className = "video-card";

            const image = document.createElement("img");
            image.src = video.thumbnail;
            image.alt = video.title;
            image.loading = "lazy";

            const thumbnail = document.createElement("div");
            thumbnail.className = "thumbnail";
            thumbnail.appendChild(image);

            const content = document.createElement("div");
            content.className = "video-card-content";

            const title = document.createElement("h3");
            title.textContent = video.title;

            const button = document.createElement("button");
            button.className = "watch-button";
            button.textContent = "Watch Video";

            button.onclick = () => openVideo(video);

            content.appendChild(title);
            content.appendChild(button);

            card.appendChild(thumbnail);
            card.appendChild(content);

            card.onclick = () => openVideo(video);

            grid.appendChild(card);

        });

        if (videos.length === 0) {
            grid.innerHTML = "<p>No videos available.</p>";
        }

    } catch (error) {

        grid.innerHTML =
        "<p>Unable to load videos. Check GitHub repository settings.</p>";

        console.error(error);

    }

}


// OPEN VIDEO DETAILS

function openVideo(video) {

    selectedVideo = video;

    document.getElementById("homePage").classList.add("hidden");

    document.getElementById("detailsPage").classList.remove("hidden");

    document.getElementById("detailThumbnail").src = video.thumbnail;

    document.getElementById("detailTitle").textContent = video.title;

    document.getElementById("detailDate").textContent =
        "ADDED " + new Date().toLocaleDateString("en-GB");

    document.getElementById("playerContainer").classList.add("hidden");

    document.getElementById("adMessage").classList.add("hidden");

    document.getElementById("videoPlayer").pause();

    window.scrollTo(0, 0);

}


// BACK BUTTON

function goBack() {

    const player = document.getElementById("videoPlayer");

    player.pause();
    player.removeAttribute("src");
    player.load();

    document.getElementById("detailsPage").classList.add("hidden");

    document.getElementById("homePage").classList.remove("hidden");

    window.scrollTo(0, 0);

}


// PLAY BUTTON

function playVideo() {

    // Real advertisement integration is required here.
    // Do not unlock video until the ad provider confirms
    // both completed advertisements.

    document.getElementById("adMessage").classList.remove("hidden");

}


// Called after verified completion of both advertisements.

function unlockVideo() {

    if (!selectedVideo) return;

    const player = document.getElementById("videoPlayer");

    player.src = selectedVideo.video;

    document.getElementById("adMessage").classList.add("hidden");

    document.getElementById("playerContainer").classList.remove("hidden");

    player.play().catch(() => {});

}


// SHARE VIDEO LINK

async function shareVideo() {

    if (!selectedVideo) return;

    const url = window.location.origin +
        window.location.pathname +
        "?video=" + selectedVideo.id;

    try {

        await navigator.clipboard.writeText(url);

        alert("Video link copied!");

    } catch {

        prompt("Copy video link:", url);

    }

}


// SUPPORT DIRECT VIDEO LINKS

async function checkSharedLink() {

    const id = new URLSearchParams(location.search).get("video");

    if (!id) return;

    const response = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/contents/thumbnails?ref=${BRANCH}`
    );

    if (!response.ok) return;

    const files = await response.json();

    const file = files.find(item =>
        new RegExp(`^thumbnail${id}\\.(jpg|jpeg|png|webp)$`, "i")
        .test(item.name)
    );

    if (!file) return;

    const video = {
        id,
        title: `Video ${id}`,
        thumbnail: `thumbnails/${file.name}`,
        video: `videos/video${id}.mp4`
    };

    openVideo(video);

}


// INITIALIZE

document.addEventListener("DOMContentLoaded", async () => {

    await loadVideos();

    await checkSharedLink();

});
