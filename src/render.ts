import { getLeetCodeProblem, SearchResults } from "./fetch";

export function renderResults(container: HTMLElement, results: SearchResults, append: boolean = false) {
  const { totalMatches, results: questions } = results;
  const resultsContainer = container.querySelector(
    "#mini-leet-results",
  ) as HTMLDivElement;

  if (!append) {
    resultsContainer.innerHTML = `<div style="padding: 10px; font-weight: 600; font-size: 0.9rem; border-bottom: 1px solid var(--border-color); color: var(--secondary-text-color);">Total Matches: ${totalMatches}</div>`;
  }

  questions.forEach((q) => {
    const questionDiv = document.createElement("div");
    questionDiv.style.cssText = `display: flex;
                                align-items: center;
                                padding: 10px 12px;
                                width: 100%;
                                box-sizing: border-box;
                                border-bottom: 1px solid var(--border-color);
                                gap: 12px;`;

    const difficultyColor = 
      q.difficulty === "Easy" ? "#00af9b" : 
      q.difficulty === "Medium" ? "#ffb800" : 
      "#ff2d55";

    questionDiv.innerHTML = `
      <div style="width: 24px; height: 24px; border-radius: 50%; background-color: ${difficultyColor}; 
                  display: flex; align-items: center; justify-content: center; flex-shrink: 0; 
                  color: #fff; font-size: 10px; font-weight: bold; border: 2px solid rgba(255,255,255,0.1);">
        ${q.acceptanceRate}
      </div>
      <div style="flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0;">
        <div style="font-size: 0.95rem; color: var(--primary-text-color); 
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${q.title}
        </div>
        <div style="font-size: 0.75rem; color: var(--secondary-text-color); 
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;">
          ${q.tags.length > 0 ? '#' + q.tags.join(' #') : 'No tags'}
        </div>
      </div>
	  <button class="open-btn" type="button" style= "background: none;
									border: none;
									cursor: pointer;
									color: var(--primary-text-color);
									margin-left: 0.4rem;
									border-radius: 6px;
									transition: all 0.2s ease;
									display: flex;
									align-items: center;
									justify-content: center;
									min-width: 32px;
									min-height: 32px;
									font-size: 1.1em;">
		<span class="icon folder-download" style="background-size: 24px !important;
										background-position: center !important;"/>
		</button>
    `;

    const openQuestionButton = questionDiv.querySelector(".open-btn") as HTMLButtonElement;

    openQuestionButton.addEventListener("click", async () => {
      const results = await getLeetCodeProblem(q.slug, "javascript");
      acode.newEditorFile(`${q.slug}.js`, {
        text: results.runnableCode,
        editable: true,
      });
    });

    resultsContainer.appendChild(questionDiv);
  });
}
