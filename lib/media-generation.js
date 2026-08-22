// Demo 缺圖/缺影片時自動生成示意素材，走 fal.ai（FAL_KEY 已存在於 ~/Development/.env）。
// 失敗（缺參數或呼叫出錯）一律回明確提示，不留白讓客戶誤以為是設計上的空白。
const REQUIRED_FIELDS = ['type', 'prompt', 'dimensions'];

function failureNotice(reason) {
  return `⚠️ 此區塊生成失敗（${reason}），示意用內容無法產生`;
}

async function callFalAi(mediaRequest) {
  const key = process.env.FAL_KEY;
  if (!key) {
    throw new Error('FAL_KEY 未設定');
  }
  // ponytail: 最小可動的 fal.ai queue API 呼叫，未接重試/輪詢，正式量產前需要真實跑一次驗證回傳格式。
  const model = mediaRequest.type === 'hero-video'
    ? process.env.AWJ_FAL_VIDEO_MODEL
    : process.env.AWJ_FAL_IMAGE_MODEL;
  const response = await fetch(`https://fal.run/${model}`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt: mediaRequest.prompt, ...mediaRequest.dimensions }),
  });
  if (!response.ok) {
    throw new Error(`fal.ai 回應 ${response.status}`);
  }
  return response.json();
}

function generateMediaBlock(mediaRequest) {
  const missing = REQUIRED_FIELDS.filter((field) => !(field in mediaRequest));

  if (missing.length > 0) {
    const err = new Error(`media generation failed: missing ${missing.join(', ')}`);
    err.rendered_output = failureNotice(`缺少必要參數：${missing.join('、')}`);
    throw err;
  }

  return callFalAi(mediaRequest)
    .then((result) => `<div class="media-block generated" data-notice="示意用，非最終素材">${result.image_url || result.video_url || ''}</div>`)
    .catch((err) => {
      const wrapped = new Error(`media generation failed: ${err.message}`);
      wrapped.rendered_output = failureNotice(err.message);
      throw wrapped;
    });
}

module.exports = { generateMediaBlock };
