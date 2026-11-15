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

      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.tabs.sendMessage(
          tab.id,
          {
            type: "GET_ARTICLE_TEXT",
          },
          async (response) => {
            if (chrome.runtime.lastError) {
              resultDiv.innerText =
                "Cannot access this page. Open a normal webpage.";
              return;
            }

            if (!response || !response.text) {
              resultDiv.innerText =
                "Could not extract article text from this page.";
              return;
            }

            try {
              const summary = await getGeminiSummary(
                response.text,
                summaryType,
                result.geminiApiKey
              );

              resultDiv.innerText = summary;
            } catch (error) {
              resultDiv.innerText = "Error: " + error.message;
            }
          }
        );
      });
    });
  });
}

if (copyBtn) {
  copyBtn.addEventListener("click", () => {
    const summaryText = resultDiv.innerText;

    if (summaryText.trim()) {
      navigator.clipboard.writeText(summaryText).then(() => {
        const oldText = copyBtn.innerText;
        copyBtn.innerText = "Copied!";

        setTimeout(() => {
          copyBtn.innerText = oldText;
        }, 2000);
      });
    }
  });
}

async function getGeminiSummary(text, summaryType, apiKey) {
  const maxLength = 20000;
  const truncatedText =
    text.length > maxLength ? text.substring(0, maxLength) + "..." : text;

  let prompt;
  if (summaryType === "brief") {
    prompt = `Summarize this article in 2-3 sentences:\n\n${truncatedText}`;
  } else if (summaryType === "detailed") {
    prompt = `Give a detailed summary covering all important points:\n\n${truncatedText}`;
  } else if (summaryType === "bullets") {
    prompt = `Summarize this article in 5-7 bullet points using only "-":\n\n${truncatedText}`;
  } else {
    prompt = `Summarize this article:\n\n${truncatedText}`;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Gemini API failed");
  }

  const data = await response.json();

  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text || "No summary generated."
  );
}
