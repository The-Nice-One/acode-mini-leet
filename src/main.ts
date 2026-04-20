import styles from "./style.module.css";
import plugin from "../plugin.json";
import { searchLeetCodeProblems } from "./fetch";
import { renderResults } from "./render";
const sideBarApps = acode.require("sidebarApps");

class AcodePlugin {
  public baseUrl: string | undefined;

  async init(
    $page: Acode.WCPage,
    cacheFile: Acode.FileSystem,
    cacheFileUrl: string,
  ): Promise<void> {
    sideBarApps.add(
      "icon_class",
      "mini-leet-sidebar-app",
      "Mini Leet",
      (container) => {
        let currentSkip = 0;
        let currentQuery = "";
        let totalMatches = 0;
        let isLoading = false;
        const LIMIT = 20;

        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.height = "100%";
        container.innerHTML = `
        <div style="padding: 10px;
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    border-bottom: 1px solid var(--border-color);
                    box-sizing: border-box;">
          <div style="font-weight: 600;
                      display: flex;
                      justify-content: space-between !important;
                      align-items: center;
                      width: 100%;
                      color: var(--primary-text-color);
                      margin-bottom: 8px;">
            <span>Mini Leet</span>
          </div>
          <div style="display: flex; align-items: center; width: 100%;">
            <input
              id="mini-leet-search"
              type="search"
              name="search-input"
              placeholder="Search"
              style="flex-grow: 1; height: 32px; box-sizing: border-box; margin: 0; min-width: 0;"
            />
            <button
              id="mini-leet-search-button"
              type="button"
              style= "background: none;
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
              <span class="icon search" style="background-size: 24px !important;
                                                 background-position: center !important;"/>
            </button>
          </div>
        </div>
        <div id="mini-leet-results" class="scroll" style="width: 100%; flex-grow: 1; overflow-y: auto; overflow-x: hidden;"></div>`;

        // Future add action buttons next to header if needed:
        // <div style="display: flex;
        //                 align-items: center;">
        //       <button type="button" style= "background: none;
        //                                     border: none;
        //                                     cursor: pointer;
        //                                     color: var(--primary-text-color);
        //                                     margin-left: 0.4rem;
        //                                     border-radius: 6px;
        //                                     transition: all 0.2s ease;
        //                                     display: flex;
        //                                     align-items: center;
        //                                     justify-content: center;
        //                                     min-width: 32px;
        //                                     min-height: 32px;
        //                                     font-size: 1.1em;">
        //         <span class="icon tune" style="background-size: 24px !important;
        //                                        background-position: center !important;"/>
        //       </button>
        //       <button type="button" style= "background: none;
        //                                     border: none;
        //                                     cursor: pointer;
        //                                     color: var(--primary-text-color);
        //                                     margin-left: 0.4rem;
        //                                     border-radius: 6px;
        //                                     transition: all 0.2s ease;
        //                                     display: flex;
        //                                     align-items: center;
        //                                     justify-content: center;
        //                                     min-width: 32px;
        //                                     min-height: 32px;
        //                                     font-size: 1.1em;">
        //         <span class="icon add" style="background-size: 24px !important;
        //                                        background-position: center !important;"/>
        //       </button>
        //     </div>

        const searchInput = container.querySelector(
          "#mini-leet-search",
        ) as HTMLInputElement;
        const searchButton = container.querySelector(
          "#mini-leet-search-button",
        ) as HTMLButtonElement;
        const resultsContainer = container.querySelector(
          "#mini-leet-results",
        ) as HTMLDivElement;

        const performSearch = async (append = false) => {
          if (isLoading) return;
          if (append && currentSkip >= totalMatches) return;

          isLoading = true;
          if (!append) {
            currentSkip = 0;
            currentQuery = searchInput.value.trim();
          }

          const results = await searchLeetCodeProblems({
            keyword: currentQuery,
            skip: currentSkip,
            limit: LIMIT,
          });

          totalMatches = results.totalMatches;
          currentSkip += LIMIT;
          renderResults(container, results, append);
          isLoading = false;
        };

        searchButton.addEventListener("click", () => performSearch(false));
        searchInput.addEventListener("keypress", (e) => {
          if (e.key === "Enter") performSearch(false);
        });

        resultsContainer.addEventListener("scroll", () => {
          if (
            resultsContainer.scrollTop + resultsContainer.clientHeight >=
            resultsContainer.scrollHeight - 100
          ) {
            performSearch(true);
          }
        });
      },
      false,
      (_) => {},
    );
  }

  async destroy() {}
}

if (window.acode) {
  const acodePlugin = new AcodePlugin();
  acode.setPluginInit(
    plugin.id,
    async (
      baseUrl: string,
      $page: Acode.WCPage,
      { cacheFileUrl, cacheFile }: Acode.PluginInitOptions,
    ) => {
      if (!baseUrl.endsWith("/")) {
        baseUrl += "/";
      }
      acodePlugin.baseUrl = baseUrl;
      await acodePlugin.init($page, cacheFile, cacheFileUrl);
    },
  );
  acode.setPluginUnmount(plugin.id, () => {
    acodePlugin.destroy();
  });
}
