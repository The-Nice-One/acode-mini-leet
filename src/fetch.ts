export interface SearchOptions {
  keyword?: string;
  limit?: number;
  skip?: number;
  difficulty?: string;
  tags?: string[];
}

export interface Filters {
  searchKeywords?: string;
  difficulty?: string;
  tags?: string[];
}

export interface GraphQLResponse {
  data: {
    problemsetQuestionList: {
      total: number;
      questions: {
        title: string;
        titleSlug: string;
        difficulty: string;
        acRate: number;
        topicTags: {
          name: string;
          slug: string;
        }[];
      }[];
    };
  };
  errors?: {
    message: string;
  }[];
}

export interface LeetCodeQuestion {
  title: string;
  slug: string;
  difficulty: string;
  acceptanceRate: string;
  tags: string[];
}

export interface SearchResults {
  totalMatches: number;
  results: LeetCodeQuestion[];
}

export async function searchLeetCodeProblems(options: SearchOptions = {}) {
  const {
    keyword = "",
    limit = 20,
    skip = 0,
    difficulty = "",
    tags = [],
  } = options;

  const query = `
        query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
            problemsetQuestionList: questionList(
                categorySlug: $categorySlug
                limit: $limit
                skip: $skip
                filters: $filters
            ) {
                total: totalNum
                questions: data {
                    title
                    titleSlug
                    difficulty
                    acRate
                    topicTags {
                        name
                        slug
                    }
                }
            }
        }
    `;

  const filters: Filters = {};
  if (keyword) filters.searchKeywords = keyword;
  if (difficulty) filters.difficulty = difficulty;
  if (tags.length > 0) filters.tags = tags;

  const payload = JSON.stringify({
    operationName: "problemsetQuestionList",
    query: query,
    variables: {
      categorySlug: "", // Default to all categories
      skip: skip,
      limit: limit,
      filters: filters,
    },
  });
  const safePayload = payload.replace(/'/g, "'\\''");

  const wgetCmd = `wget -qO- \\
	--header="Content-Type: application/json" \\
	--header="User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \\
	--header="Origin: https://leetcode.com" \\
	--header="Referer: https://leetcode.com" \\
	--post-data='${safePayload}' https://leetcode.com/graphql`;

  try {
    const stdout = await window.Executor.execute(wgetCmd, true);
    const result: GraphQLResponse = JSON.parse(stdout);

    if (result.errors) {
      window.toast(`LeetCode API Error: ${result.errors[0].message}`, 3000);
      throw new Error(result.errors[0].message);
    }

    const listData = result.data.problemsetQuestionList;

    const formattedQuestions: LeetCodeQuestion[] = listData.questions.map(
      (q) => ({
        title: q.title,
        slug: q.titleSlug,
        difficulty: q.difficulty,
        acceptanceRate: Math.round(q.acRate) + "%",
        tags: q.topicTags.map((t) => t.name),
      }),
    );

    return {
      totalMatches: listData.total,
      results: formattedQuestions,
    };
  } catch (err: any) {
    window.toast(`Wget Search Error: ${err.message}`, 3000);
    throw err;
  }
}

export interface LeetCodeResult {
    title: string;
    description: string;
    runnableCode: string;
}

export async function getLeetCodeProblem(slug: string, lang: 'javascript' | 'typescript' = 'javascript'): Promise<LeetCodeResult> {
    if (lang !== 'javascript' && lang !== 'typescript') {
        throw new Error("Only javascript and typescript are supported.");
    }

    const query = `
        query getQuestionDetail($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
                title
                content
                exampleTestcases
                codeSnippets {
                    langSlug
                    code
                }
            }
        }
    `;

    const payload = JSON.stringify({ query, variables: { titleSlug: slug } });
    const safePayload = payload.replace(/'/g, "'\\''");

    const wgetCmd = `wget -qO- \\
	  --header="Content-Type: application/json" \\
	  --header="Content-Type: application/json" \\
	  --header="User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \\
	  --header="Origin: https://leetcode.com" \\
	  --header="Referer: https://leetcode.com" \\
	  --post-data='${safePayload}' https://leetcode.com/graphql`;

    try {
        const stdout = await window.Executor.execute(wgetCmd, true);
        const result = JSON.parse(stdout);

        if (result.errors) throw new Error(result.errors[0].message);

        const q = result.data.question;
        if (!q) throw new Error("Problem not found.");

        const snippet = q.codeSnippets.find((s: { langSlug: string, code: string }) => s.langSlug === lang);
        if (!snippet) throw new Error(`No starter code found for ${lang}`);

        const cleanDescription = stripHtmlAndEntities(q.content);
        const runnableCode = generateRunnableFile(q.title, cleanDescription, snippet.code, q.exampleTestcases);

        return {
            title: q.title,
            description: cleanDescription,
            runnableCode: runnableCode
        };

    } catch (err) {
        console.error("Wget Fetch Error:", err);
        throw err;
    }
}

/**
 * Helper to strip HTML tags and decode common entities from the description.
 */
function stripHtmlAndEntities(html: string): string {
    if (!html) return "";
    return html
        .replace(/<[^>]*>?/gm, '') // Remove all HTML tags
        .replace(/&nbsp;/g, ' ')   // Replace non-breaking spaces
        .replace(/&lt;/g, '<')     // Replace <
        .replace(/&gt;/g, '>')     // Replace >
        .replace(/&quot;/g, '"')   // Replace "
        .replace(/&#39;/g, "'")    // Replace '
        .trim();
}

/**
 * Combines the title, description, starter code, and test cases into one formatted string.
 */
function generateRunnableFile(title: string, description: string, starterCode: string, rawTestCases: string): string {
    const formattedDescription = description.split('\n').join('\n * ');
    const headerComment = `/**\n * Title: ${title}\n * \n * Description:\n * ${formattedDescription}\n */\n\n`;
    const testCode = generateTestCases(starterCode, rawTestCases);

    return headerComment + starterCode + testCode;
}

/**
 * Parses the starter code to find the function signature 
 * and maps the raw testcases into executable console.log calls.
 */
function generateTestCases(starterCode: string, rawTestCases: string): string {
    if (!rawTestCases) return "";

    // Regex to extract JS/TS function names and arguments.
    const signatureRegex = /(?:var\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*=\s*function|function\s+([a-zA-Z_$][0-9a-zA-Z_$]*))\s*\(([^)]*)\)/;
    
    const match = starterCode.match(signatureRegex);
    if (!match) {
        return "\n\n// Could not auto-generate test cases (unrecognized function signature).";
    }

    const funcName = match[1] || match[2];
    const argsString = match[3];
  
    const numArgs = argsString.trim().length === 0 ? 0 : argsString.split(',').length;
    
    let testCode = `\n\n// --- Auto-Generated Test Cases ---\n`;
    
    if (numArgs === 0) {
        testCode += `console.log(${funcName}());\n`;
        return testCode;
    }

    const lines = rawTestCases.trim().split('\n');
    
    for (let i = 0; i < lines.length; i += numArgs) {
        const currentArgs = lines.slice(i, i + numArgs);
        if (currentArgs.length === numArgs) {
            testCode += `console.log(${funcName}(${currentArgs.join(', ')}));\n`;
        }
    }

    return testCode;
}