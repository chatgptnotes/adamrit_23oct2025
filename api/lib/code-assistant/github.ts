// GitHub branch + commit helper using Octokit.
// See: bettroi-vault/Adamrit/Super-Admin-Code-Assistant-Plan.md §24.7

import { Octokit } from '@octokit/rest';

const REPO_OWNER = process.env.GITHUB_REPO_OWNER ?? 'chatgptnotes';
const REPO_NAME = process.env.GITHUB_REPO_NAME ?? 'adamrit.com';
const BASE_BRANCH = process.env.GITHUB_BASE_BRANCH ?? 'main';

export class GitHubError extends Error {
  constructor(public code: string, public details?: unknown) {
    super(code);
  }
}

function getOctokit(): Octokit {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new GitHubError('missing-github-token');
  return new Octokit({ auth: token });
}

export async function commitToGitHub(
  userId: string,
  generationId: string,
  files: Array<{ path: string; action: 'modify' | 'create'; content: string }>,
): Promise<{ name: string; sha: string }> {
  const oct = getOctokit();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const branchName = `superadmin-edits/${stamp}-${userId.slice(0, 8)}`;

  try {
    const { data: baseRef } = await oct.git.getRef({
      owner: REPO_OWNER, repo: REPO_NAME, ref: `heads/${BASE_BRANCH}`,
    });

    await oct.git.createRef({
      owner: REPO_OWNER, repo: REPO_NAME, ref: `refs/heads/${branchName}`, sha: baseRef.object.sha,
    });

    let lastCommit = baseRef.object.sha;
    let lastTree = (await oct.git.getCommit({
      owner: REPO_OWNER, repo: REPO_NAME, commit_sha: lastCommit,
    })).data.tree.sha;

    for (const file of files) {
      const blob = await oct.git.createBlob({
        owner: REPO_OWNER, repo: REPO_NAME,
        content: Buffer.from(file.content).toString('base64'),
        encoding: 'base64',
      });
      const tree = await oct.git.createTree({
        owner: REPO_OWNER, repo: REPO_NAME, base_tree: lastTree,
        tree: [{ path: file.path, mode: '100644', type: 'blob', sha: blob.data.sha }],
      });
      const commit = await oct.git.createCommit({
        owner: REPO_OWNER, repo: REPO_NAME,
        message: `code-assistant: ${file.action} ${file.path}\n\nGeneration ${generationId}`,
        tree: tree.data.sha,
        parents: [lastCommit],
      });
      lastCommit = commit.data.sha;
      lastTree = tree.data.sha;
    }

    await oct.git.updateRef({
      owner: REPO_OWNER, repo: REPO_NAME, ref: `heads/${branchName}`, sha: lastCommit,
    });

    return { name: branchName, sha: lastCommit };
  } catch (e: any) {
    if (e instanceof GitHubError) throw e;
    if (e.status === 401) throw new GitHubError('github-auth-failed', { message: e.message });
    if (e.status === 422) throw new GitHubError('github-conflict', { message: e.message });
    if (e.status === 429 || e.status === 403) throw new GitHubError('github-rate-limit', { message: e.message });
    if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') throw new GitHubError('github-network-error', { message: e.message });
    throw new GitHubError('github-unknown', { message: e.message, status: e.status });
  }
}

export async function searchFiles(query: string, limit = 20): Promise<string[]> {
  const oct = getOctokit();
  try {
    const q = `repo:${REPO_OWNER}/${REPO_NAME} path:src filename:${query}`;
    const { data } = await oct.search.code({ q, per_page: limit });
    return data.items.map((i: any) => i.path);
  } catch {
    return [];
  }
}
