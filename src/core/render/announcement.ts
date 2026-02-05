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
        body { background-color: #f5f5f5; font-family: sans-serif; }
        .main-container { padding: 40px 20px; max-width: 800px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="main-container">
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
                    <span>👍 点赞 ${data.stats.liked}</span>
                </div>
                <div class="card-footer-item has-text-grey">
                    <span>⭐ 收藏 ${data.stats.collected}</span>
                </div>
                <div class="card-footer-item has-text-grey">
                    <span>💬 评论 ${data.stats.commented}</span>
                </div>
            </footer>
        </div>
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
