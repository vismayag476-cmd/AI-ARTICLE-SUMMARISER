const summarizeBtn = document.getElementById("summarize");
const copyBtn = document.getElementById("copy-btn");
const resultDiv = document.getElementById("result");


if (summarizeBtn) {

  summarizeBtn.addEventListener("click", async () => {

    resultDiv.innerHTML =
      '<div class="loading"><div class="loader"></div></div>';

    const summaryType =
      document.getElementById("summary-type")?.value || "brief";


    chrome.storage.sync.get(["geminiApiKey"], async (result) => {

      if (!result.geminiApiKey) {

        resultDiv.innerText =
          "API key not found. Please add your Gemini API key.";

        return;
      }


      chrome.tabs.query(
        { active: true, currentWindow: true },
        ([tab]) => {


          chrome.tabs.sendMessage(
            tab.id,
