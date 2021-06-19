let videoList = [];
let hostname;

/**
 * INITIALSIER CODE
 */

// Load list of video lectures.
document.addEventListener('DOMContentLoaded', async() => {
    document.getElementById('github').addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://github.com/Yharooer/panopto-downloader-chrome' });
    });
    const currentTabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = currentTabs[0];
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        files: ['scripts/scraper.js']
    });
});

/**
 * MESSAGING HANDLER
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action == 'VIDEO_LIST') {
        videoList = request.videoDetails;
        hostname = request.hostname;

        if (videoList == null || videoList.length == 0) {
            // Set view to no videos found.
            document.getElementById('loading').style.display = 'none';
            document.getElementById('not_detected').style.display = 'block';

            if (request.hostname.toLowerCase().includes('panopto.eu') || request.hostname.toLowerCase().includes('panopto.com')) {
                document.getElementById('is_panopto_url').style.display = 'block';
            }
            return;
        }

        // Add download all button if there is more than one video.
        if (videoList.length > 1) {
            const batch_dl_div = document.createElement('div');
            batch_dl_div.style.width = '100%';
            batch_dl_div.style.textAlign = 'center';
            const batch_dl_button = createDownloadAllButton(`Download ${videoList.length} videos`);
            batch_dl_div.appendChild(batch_dl_button);
            batch_dl_button.id = 'batch_download';
            batch_dl_button.addEventListener('click', () => {
                quickDownloadMany(videoList);
            });
            document.getElementById('downloader').insertBefore(batch_dl_div, document.getElementById('downloader_list'));
        }
        document.getElementById('downloader_list').appendChild(document.createElement('hr'));

        // Add a download section for each video found.
        for (let i = 0; i < videoList.length; i++) {
            const div_el = document.createElement('div');
            div_el.classList.add('video_element');
            div_el.id = `video_element_${videoList[i].id}`;
            const div_im = document.createElement('div');
            div_im.classList.add('image_container');
            div_im.style.backgroundImage = `url(${getVideoPreviewLink(videoList[i].id, request.hostname)})`;
            div_el.appendChild(div_im);
            const div_txcnt = document.createElement('div');
            div_txcnt.classList = 'text_container';
            div_el.appendChild(div_txcnt);
            const p = document.createElement('p');
            p.innerHTML = videoList[i].name;
            div_txcnt.appendChild(p);
            const but = createMaterialButton('Download');
            but.addEventListener('click', () => {
                quickDownloadOne(videoList[i]);
            });
            div_txcnt.append(but);
            document.getElementById('downloader_list').appendChild(div_el);
            if (i + 1 < videoList.length) {
                document.getElementById('downloader_list').appendChild(document.createElement('hr'));
            }
        }
        document.getElementById('loading').style.display = 'none';
        document.getElementById('downloader').style.display = 'block';
    }
});

function createMaterialButton(text) {
    const button = document.createElement('button');
    button.classList.add('mdc-button');
    const ripple = document.createElement('span');
    ripple.classList.add('mdc-button__ripple');
    const label = document.createElement('span');
    label.classList.add('mdc-button__label');
    label.innerHTML = text;
    button.setLabel = newText => label.innerHTML = newText;
    button.appendChild(ripple);
    button.appendChild(label);
    mdc.ripple.MDCRipple.attachTo(button);
    return button;
}

function createOutlinedMaterialButton(text) {
    const button = createMaterialButton(text);
    button.classList.add('mdc-button--outlined');
    return button;
}

function createDownloadAllButton(text) {
    const button = createOutlinedMaterialButton(text);
    const icon = document.createElement('i');
    icon.classList.add('material-icons');
    icon.classList.add('mdc-button__icon');
    icon.setAttribute('aria-hidden', "true");
    icon.innerHTML = 'download';
    button.getElementsByClassName('mdc-button__label')[0].prepend(icon);
    return button;
}

/**
 * DOWNLOADING FUNCTIONALITY
 */

// Download one video in podcast form.
function quickDownloadOne(video) {
    const name = video.name;
    const id = video.id;
    // TODO instead will be given to Download Manager
    chrome.downloads.download({ url: getPodcastLink(id), filename: safeFileName(name + '.mp4') });
}

// Download many videos in podcast form.
function quickDownloadMany(vidList) {
    console.log(vidList);
    for (let i = 0; i < vidList.length; i++) {
        console.log(vidList[i]);
        quickDownloadOne(vidList[i]);
    }
}

// Makes a name safe to be a filename for Windows and Unix-based systems.
function safeFileName(filename) {
    filename = filename.replace(/[\/\\:*?<>]/g, ' ');
    filename = filename.replace('"', "'");
    while (filename.includes('..')) {
        filename = filename.replace('..', '');
    }
    return filename;
}

/** 
 * FUNCTIONS TO GET URLS
 */
function getVideoPreviewLink(id) {
    return `https://${hostname}/Panopto/Services/FrameGrabber.svc/FrameRedirect?objectId=${id}&mode=Delivery`;
}

function getPodcastLink(id) {
    return `https://${hostname}/Panopto/Podcast/Social/${id}.mp4`;
}

function getDeliveryInfoLink() {
    return `https://${hostname}/Panopto/Pages/Viewer/DeliveryInfo.aspx`;
}