// Interfaces defined based on the provided JSON structure
import { Context } from 'koishi';

interface ImageInfo {
  url: string;
  width: number;
  height: number;
}

interface TextInfo {
  content: string;
}

interface TagInfo {
  id: number;
  name: string;
}

interface StatsInfo {
  liked: string;
  collected: string;
  commented: string;
}

interface UserInfo {
  nickname: string;
  avatar: string;
}

interface AnnouncementData {
  title: string;
  published_at_ts: number;
  user: UserInfo;
  images: ImageInfo[];
  texts: TextInfo[];
  tags: TagInfo[];
  stats: StatsInfo;
}

export function generateAnnouncement(data: AnnouncementData): string {
  // Helper to format timestamp to readable date
  const formatDate = (ts: number): string => {
    const date = new Date(ts * 1000);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Generate HTML for tags
  const tagsHtml = data.tags
    .map((tag) => `<span class="tag is-info is-light mr-2">${tag.name}</span>`)
    .join('');

  // Generate HTML for text paragraphs
  const contentHtml = data.texts
    .map((text) => {
      // Simple handling for links inside text if raw content contains them,
      // otherwise just wrap in paragraph
      return `<p class="mb-2">${text.content}</p>`;
    })
    .join('');

  // Generate HTML for images
  const imagesHtml = data.images
    .map(
      (img) => `
  <div class="block">
    <figure class="image">
      <img src="${img.url}" alt="Post Image" style="border-radius: 6px;">
    </figure>
  </div>
`
    )
    .join('');

  const dateStr = formatDate(data.published_at_ts);

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <link rel="stylesheet" href="https://cdn.bootcdn.net/ajax/libs/bulma/1.0.4/css/bulma.min.css">
  <style>
    /* Minimal override to ensure good contrast for screenshot generation */
    body { background-color: #f5f5f5; font-family: 'Maple Mono NF CN', sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-content">
      <!-- Header: User Info -->
      <div class="media">
        <div class="media-left">
          <figure class="blob is-48x48">
            <img class="is-rounded" src="${data.user.avatar}" alt="Avatar" style="width: 48px; height: 48px;">
          </figure>
        </div>
        <div class="media-content">
          <p class="title is-4">${data.user.nickname}</p>
          <p class="subtitle is-6 has-text-grey">
            <time>${dateStr}</time>
          </p>
        </div>
      </div>

      <!-- Title & Tags -->
      <div class="block mt-4">
        <h1 class="title is-3 has-text-dark">${data.title}</h1>
        <div class="tags mb-4">
          ${tagsHtml}
        </div>
      </div>

      <!-- Text Content -->
      <div class="content is-medium has-text-grey-dark">
        ${contentHtml}
      </div>

      <!-- Image Gallery -->
      <div class="block mt-5">
        ${imagesHtml}
      </div>
    </div>

    <!-- Footer: Stats -->
    <footer class="card-footer">
      <div class="card-footer-item has-text-grey">
        <span class="icon-text">
          <span class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-thumbs-up-icon lucide-thumbs-up"><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/><path d="M7 10v12"/></svg>
          </span>
          <span>点赞 ${data.stats.liked}</span>
        </span>
      </div>
      <div class="card-footer-item has-text-grey">
        <span class="icon-text">
          <span class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star-icon lucide-star"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>
          </span>
          <span>收藏 ${data.stats.collected}</span>
        </span>
      </div>
      <div class="card-footer-item has-text-grey">
        <span class="icon-text">
          <span class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-messages-square-icon lucide-messages-square"><path d="M16 10a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 14.286V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/><path d="M20 9a2 2 0 0 1 2 2v10.286a.71.71 0 0 1-1.212.502l-2.202-2.202A2 2 0 0 0 17.172 19H10a2 2 0 0 1-2-2v-1"/></svg>
          </span>
          <span>评论 ${data.stats.commented}</span>
        </span>
      </div>
    </footer>
  </div>
</body>
</html>
`;
}

// Reserved for future rendering function
export async function renderAnnouncement(ctx: Context, announcement: any): Promise<string> {
  const { puppeteer } = ctx;

  const html = generateAnnouncement(announcement);
  return puppeteer.render(html);
}
