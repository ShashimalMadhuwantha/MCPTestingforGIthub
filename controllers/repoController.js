const { getClient } = require("../config/githubClient");
const { summarizeText } = require("../services/aiService");

// ...existing code...
exports.getRepos = async (req, res) => {
  try {
    const client = getClient();

    const {
      page = 1,
      per_page = 30,
      visibility,      // all | public | private
      affiliation,     // owner,collaborator,organization_member
      type,            // all | owner | public | private | member
      sort = "pushed", // created | updated | pushed | full_name
      direction = "desc",
      q,               // search in name/description/full_name
      language,        // filter by primary language
      min_stars,       // filter by stargazers_count >= N
      summary,         // "true" to include AI summary
    } = req.query;

    const params = {
      page: Number(page),
      per_page: Math.min(Number(per_page) || 30, 100),
      ...(visibility ? { visibility } : {}),
      ...(affiliation ? { affiliation } : {}),
      ...(type ? { type } : {}),
      ...(sort ? { sort } : {}),
      ...(direction ? { direction } : {}),
    };

    const { data, headers } = await client.repos.listForAuthenticatedUser(params);

    // Client-side filters
    let items = data;
    if (q) {
      const s = String(q).toLowerCase();
      items = items.filter(
        (r) =>
          r.name?.toLowerCase().includes(s) ||
          r.full_name?.toLowerCase().includes(s) ||
          r.description?.toLowerCase().includes(s)
      );
    }
    if (language) {
      const lang = String(language).toLowerCase();
      items = items.filter((r) => (r.language || "").toLowerCase() === lang);
    }
    if (min_stars) {
      const min = Number(min_stars) || 0;
      items = items.filter((r) => (r.stargazers_count || 0) >= min);
    }

    // Trim fields for lighter responses
    const mapped = items.map((r) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      private: r.private,
      description: r.description,
      html_url: r.html_url,
      default_branch: r.default_branch,
      fork: r.fork,
      archived: r.archived,
      language: r.language,
      stargazers_count: r.stargazers_count,
      forks_count: r.forks_count,
      open_issues_count: r.open_issues_count,
      watchers_count: r.watchers_count,
      license: r.license?.spdx_id || null,
      pushed_at: r.pushed_at,
      updated_at: r.updated_at,
      created_at: r.created_at,
      owner: { login: r.owner?.login, type: r.owner?.type },
    }));

    const pageInfo = parseLink(headers?.link);

    const payload = {
      page: Number(page),
      per_page: Math.min(Number(per_page) || 30, 100),
      filters: { visibility, affiliation, type, sort, direction, q, language, min_stars: min_stars ? Number(min_stars) : undefined },
      pageInfo,
      count: mapped.length,
      items: mapped,
    };

    if (String(summary).toLowerCase() === "true" && mapped.length) {
      // Cap input size to avoid token limits
      const top = mapped.slice(0, 50);
      const lines = top.map(
        (r) =>
          `${r.full_name} — ${r.stargazers_count}★, forks:${r.forks_count}, issues:${r.open_issues_count}, pushed:${r.pushed_at}\n${r.description || ""}`
      );
      const prompt = `Summarize these repositories for the authenticated user. Highlight the most active projects, notable tech, and priorities.\n\n${lines.join(
        "\n\n"
      )}`;
      payload.summary = await summarizeText(prompt);
    }

    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Minimal Link header parser for pagination
function parseLink(link) {
  if (!link) return null;
  const rels = {};
  for (const part of link.split(",")) {
    const m = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (!m) continue;
    const url = new URL(m[1]);
    const page = url.searchParams.get("page");
    rels[m[2]] = { url: m[1], page: page ? Number(page) : undefined };
  }
  return { next: rels.next || null, prev: rels.prev || null, first: rels.first || null, last: rels.last || null };
}
// ...existing code...