console.log("CONTENT SCRIPT LOADED");


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.type === "GET_ARTICLE_TEXT") {

        sendResponse({
            text: document.body.innerText
        });

    }

    return true;
});