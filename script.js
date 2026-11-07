
/* =====================================
   DESHI DYNAMIC VIDEO SYSTEM
===================================== */

const OWNER = "arya250";
const REPO = "Deshi";
const BRANCH = "main";

const API_ROOT =
    `https://api.github.com/repos/${OWNER}/${REPO}/contents`;

const RAW_ROOT =
    `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`;

const TARGET_CARDS = 100;
const PAGE_SIZE = 40;

const TELEGRAM_CHANNELS = [
    {
        name: "DESHI VEDIOS 🚀",
        url: "https://t.me/viral5x"
    },
    {
        name: "INSTAGRAM VIRAL 🎀",
        url: "https://t.me/viral6x"
    },
    {
        name: "LEAKED VIDEOS 🔞",
        url: "https://t.me/vital2x"
    },
    {
        name: "MMS 🍑 ",
        url: "https://t.me/viral8x"
    },
    {
        name: "TRENDING VEDIOS 📈",
        url: "https://t.me/adulthoty"
    },
];

let videos = [];
let thumbnails = [];
let feed = [];
let selectedVideo = null;
let currentIndex = 0;
let playing = false;


/* =====================================
   RANDOM SHUFFLE
===================================== */

function shuffle(array) {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}


/* =====================================
   FETCH GITHUB FOLDER
===================================== */

async function getFolder(folder) {

    const response = await fetch(
        `${API_ROOT}/${folder}?ref=${BRANCH}`
    );

    if (!response.ok) {
        throw new Error(`Unable to load ${folder} folder`);
    }

    const files = await response.json();

    if (!Array.isArray(files)) {
        throw new Error(`Invalid ${folder} folder`);
    }

    return files.filter(file => file.type === "file");
}


/* =====================================
   FILE EXTENSIONS
===================================== */

function isVideo(file) {
    return /\.(mp4|webm|mov|m4v|ogv)$/i.test(file.name);
}

function isImage(file) {
    return /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);
}


/* =====================================
   LOAD ALL MEDIA
===================================== */

async function loadVideos() {

    const grid = document.getElementById("videoGrid");

    try {

        const [videoFiles, imageFiles] = await Promise.all([
            getFolder("videos"),
            getFolder("thumbnails")
        ]);

        videos = videoFiles
            .filter(isVideo)
            .map(file => ({
                name: file.name,
                url: file.download_url
            }))
            .filter(file => file.url);

        thumbnails = imageFiles
            .filter(isImage)
            .map(file => ({
                name: file.name,
                url: file.download_url
            }))
            .filter(file => file.url);

        if (!videos.length) {
            throw new Error("No video files found.");
        }

        if (!thumbnails.length) {
            throw new Error("No thumbnails found.");
        }

        createRandomFeed();

        renderVideos();

        checkSharedLink();

    } catch (error) {

        console.error(error);

        grid.innerHTML = `
            <div class="loading-card">
                <p>${escapeHTML(error.message)}</p>
                <button class="load-more" onclick="loadVideos()">
                    Try Again
                </button>
            </div>
        `;
    }
}


/* =====================================
   RANDOM VIDEO + THUMBNAIL MATCHING
===================================== */

function createRandomFeed() {

    const randomVideos = shuffle(videos);
    const randomImages = shuffle(thumbnails);

    feed = [];

    const total = Math.max(
        TARGET_CARDS,
        videos.length
    );

    for (let i = 0; i < total; i++) {

        const video = randomVideos[i % randomVideos.length];

        const thumbnail = randomImages[i % randomImages.length];

        feed.push({

            id: `card-${i}`,

            video: video,

            thumbnail: thumbnail,

        });
    }

    // Random card order
    feed = shuffle(feed);

    currentIndex = 0;
}


/* =====================================
   SAFE HTML TEXT
===================================== */

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}


/* =====================================
   RENDER VIDEO CARDS
===================================== */

function renderVideos() {

    const grid = document.getElementById("videoGrid");

    grid.innerHTML = "";

    const visible = feed.slice(0, currentIndex + PAGE_SIZE);

    visible.forEach((item, index) => {

        const card = document.createElement("article");

        card.className = "video-card";

        card.style.animationDelay =
            `${Math.min(index % PAGE_SIZE, 15) * 25}ms`;

        const image = document.createElement("img");

        image.src = item.thumbnail.url;

        image.alt = "";

        image.loading = "lazy";

        image.decoding = "async";

        image.onerror = () => {
            image.style.opacity = "0";
        };

        const thumbnail = document.createElement("div");

        thumbnail.className = "thumbnail";

        thumbnail.appendChild(image);

        card.appendChild(thumbnail);

        card.addEventListener("click", () => {
            openVideo(item);
        });

        grid.appendChild(card);
    });

    document.getElementById("countBadge").textContent =
        visible.length;

    document.getElementById("videoCount").textContent =
        `${videos.length} videos available`;

    const moreButton = document.getElementById("loadMoreBtn");

    moreButton.classList.toggle(
        "hidden",
        currentIndex + PAGE_SIZE >= feed.length
    );
}


/* =====================================
   LOAD MORE
===================================== */

function loadMoreVideos() {

    if (currentIndex + PAGE_SIZE >= feed.length) return;

    currentIndex += PAGE_SIZE;

    renderVideos();
}


/* =====================================
   OPEN VIDEO
===================================== */

function openVideo(item) {

    selectedVideo = item;

    playing = false;

    stopPlayer();

    document.getElementById("homePage")
        .classList.add("hidden");

    document.getElementById("telegramPage")
        .classList.add("hidden");

    document.getElementById("detailsPage")
        .classList.remove("hidden");

    document.getElementById("detailThumbnail").src =
        item.thumbnail.url;

    document.getElementById("playerContainer")
        .classList.add("hidden");

    document.getElementById("loadingOverlay")
        .classList.add("hidden");

    renderSuggested(item);

    const params = new URLSearchParams();

    params.set("v", item.video.name);

    history.pushState(
        { page: "video" },
        "",
        `?${params.toString()}`
    );

    window.scrollTo(0, 0);
}


/* =====================================
   VIDEO PLAYER
===================================== */

function playVideo() {

    if (!selectedVideo || playing) return;

    playing = true;

    const player = document.getElementById("videoPlayer");

    const overlay = document.getElementById("loadingOverlay");

    overlay.classList.remove("hidden");

    player.src = selectedVideo.video.url;

    player.oncanplay = async () => {

        overlay.classList.add("hidden");

        document.getElementById("playerContainer")
            .classList.remove("hidden");

        try {
            await player.play();
        } catch (error) {
            console.log("Press play to start the video.");
        }
    };

    player.onerror = () => {

        overlay.classList.add("hidden");

        playing = false;

        alert("Unable to play this video. Check the video file.");

        stopPlayer();
    };

    player.load();
}


/* =====================================
   STOP PLAYER
===================================== */

function stopPlayer() {

    const player = document.getElementById("videoPlayer");

    player.pause();

    player.removeAttribute("src");

    player.load();

    playing = false;
}


/* =====================================
   SUGGESTED VIDEOS
===================================== */

function renderSuggested(current) {

    const grid = document.getElementById("suggestedGrid");

    grid.innerHTML = "";

    const suggestions = shuffle(
        feed.filter(item => item !== current)
    ).slice(0, 6);

    suggestions.forEach(item => {

        const card = document.createElement("div");

        card.className = "suggested-card";

        const img = document.createElement("img");

        img.src = item.thumbnail.url;

        img.alt = "";

        img.loading = "lazy";

        card.appendChild(img);

        card.onclick = () => {
            openVideo(item);
        };

        grid.appendChild(card);
    });
}


/* =====================================
   SHARE VIDEO
===================================== */

async function shareVideo() {

    if (!selectedVideo) return;

    const url = new URL(window.location.href);

    url.search = "";

    url.searchParams.set("v", selectedVideo.video.name);

    try {

        if (navigator.share) {

            await navigator.share({
                title: "DESHI",
                text: "Watch this video on DESHI.",
                url: url.href
            });

        } else {

            await navigator.clipboard.writeText(url.href);

            alert("Link copied!");

        }

    } catch (error) {

        if (error.name !== "AbortError") {
            prompt("Copy video link:", url.href);
        }
    }
}


/* =====================================
   TELEGRAM PAGE
===================================== */

function showTelegram() {

    stopPlayer();

    document.getElementById("homePage")
        .classList.add("hidden");

    document.getElementById("detailsPage")
        .classList.add("hidden");

    document.getElementById("telegramPage")
        .classList.remove("hidden");

    history.pushState(
        { page: "telegram" },
        "",
        "?page=telegram"
    );

    renderTelegramLinks();

    window.scrollTo(0, 0);
}


function renderTelegramLinks() {

    const container = document.getElementById("telegramLinks");

    container.innerHTML = "";

    TELEGRAM_CHANNELS.forEach(channel => {

        const link = document.createElement("a");

        link.className = "telegram-link";

        link.href = channel.url;

        link.target = "_blank";

        link.rel = "noopener noreferrer";

        const name = document.createElement("span");

        name.textContent = channel.name;

        const arrow = document.createElement("span");

        arrow.textContent = "↗";

        link.append(name, arrow);

        container.appendChild(link);
    });
}


/* =====================================
   HOME PAGE
===================================== */

function showHome() {

    stopPlayer();

    selectedVideo = null;

    document.getElementById("detailsPage")
        .classList.add("hidden");

    document.getElementById("telegramPage")
        .classList.add("hidden");

    document.getElementById("homePage")
        .classList.remove("hidden");

    history.pushState(
        {},
        "",
        window.location.pathname
    );

    window.scrollTo(0, 0);
}


function goBack() {
    showHome();
}


/* =====================================
   SHARED VIDEO LINK
===================================== */

function checkSharedLink() {

    const params = new URLSearchParams(location.search);

    const videoName = params.get("v");

    if (videoName) {

        const video = videos.find(
            item => item.name === videoName
        );

        if (video) {

            const matchingItem = feed.find(
                item => item.video.name === videoName
            );

            if (matchingItem) {
                openVideo(matchingItem);
            }
        }
    }
}


/* =====================================
   BROWSER BACK / FORWARD
===================================== */

window.addEventListener("popstate", () => {

    const params = new URLSearchParams(location.search);

    if (params.get("page") === "telegram") {

        stopPlayer();

        document.getElementById("homePage")
            .classList.add("hidden");

        document.getElementById("detailsPage")
            .classList.add("hidden");

        document.getElementById("telegramPage")
            .classList.remove("hidden");

        renderTelegramLinks();

        return;
    }

    if (params.get("v")) {

        const video = videos.find(
            item => item.name === params.get("v")
        );

        if (video) {

            const item = feed.find(
                entry => entry.video.name === video.name
            );

            if (item) {
                openVideo(item);
                return;
            }
        }
    }

    stopPlayer();

    selectedVideo = null;

    document.getElementById("detailsPage")
        .classList.add("hidden");

    document.getElementById("telegramPage")
        .classList.add("hidden");

    document.getElementById("homePage")
        .classList.remove("hidden");
});


/* =====================================
   INITIALIZE
===================================== */

document.addEventListener("DOMContentLoaded", () => {

    loadVideos();

});
