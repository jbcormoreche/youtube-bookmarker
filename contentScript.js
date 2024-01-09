(() => {
  let youtubePlayer;
  let currentVideo = "";
  let currentVideoBookmarks = [];

  const fetchBookmarks = () => {
    return new Promise((resolve) => {
      chrome.storage.sync.get([currentVideo], (obj) => {
        resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
      });
    });
  };

  const addNewBookmarkEventHandler = async () => {
    const currentTime = youtubePlayer.currentTime;
    const newBookmark = {
      time: currentTime,
      desc: "Bookmark at " + getTime(currentTime),
    };

    currentVideoBookmarks = await fetchBookmarks();

    chrome.storage.sync.set({
      [currentVideo]: JSON.stringify([...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time))
    });
  };

  const newVideoLoaded = async () => {
    const bookmarkBtnExists = document.getElementsByClassName("ytp-repeat-button")[0];
    currentVideoBookmarks = await fetchBookmarks();

    if (!bookmarkBtnExists) {
      const subtitles = document.querySelector('.ytp-subtitles-button');
      const bookmark = document.querySelector('.ytp-bookmark-button');
      youtubePlayer = document.getElementsByClassName('video-stream')[0];

      if (subtitles && !bookmark) {
        const bookmark = Object.assign(subtitles.cloneNode(true), {
          textContent: '',
          title: 'Bookmark current timestamp'
        });
        bookmark.classList.replace('ytp-subtitles-button', 'ytp-bookmark-button');
        const bookmarkBtn = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        bookmarkBtn.setAttribute("svgns", "http://www.w3.org/2000/svg");
        bookmarkBtn.setAttribute("viewBox", "0 0 18 18");
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute(
          'd',
          'M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z'
        );
        path.setAttribute('fill', '#FFFFFF');
        bookmarkBtn.appendChild(path);
        bookmark.appendChild(bookmarkBtn);
        subtitles.parentNode.insertBefore(bookmark, subtitles);

        bookmark.addEventListener("click", addNewBookmarkEventHandler);
      };
    }
  };

  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { type, value, videoId } = obj;

    if (type === "NEW") {
      currentVideo = videoId;
      newVideoLoaded();
    } else if (type === "PLAY") {
      youtubePlayer.currentTime = value;
    } else if (type === "DELETE") {
      currentVideoBookmarks = currentVideoBookmarks.filter((b) => b.time != value);
      chrome.storage.sync.set({ [currentVideo]: JSON.stringify(currentVideoBookmarks) });

      response(currentVideoBookmarks);
    }
  });

  newVideoLoaded();
})();

const getTime = t => {
  var date = new Date(0);
  date.setSeconds(t);

  return date.toISOString().slice(11, 19);
};
