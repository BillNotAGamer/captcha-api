const express = require('express');
const { createCanvas } = require('canvas');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());

// Lưu trữ mã captcha tạm thời (nên dùng Redis trong thực tế)
const captchaStore = new Map();

function generateCaptcha(req) {
  // Tạo mã ngẫu nhiên (4 ký tự)
  const code = Math.random().toString(36).substring(2, 6).toUpperCase();
  const canvas = createCanvas(120, 40);
  const ctx = canvas.getContext('2d');

  // Tạo nền trắng
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 120, 40);
  // Vẽ mã
  ctx.fillStyle = '#000';
  ctx.font = '28px Arial';
  ctx.fillText(code, 10, 30);
  // Thêm nhiễu (tùy chọn)
  for (let i = 0; i < 10; i++) {
    ctx.fillRect(Math.random() * 120, Math.random() * 40, 1, 1);
  }

  // Lưu mã theo IP
  const clientIp = req.ip || 'default';
  captchaStore.set(clientIp, code);

  // Trả về hình ảnh dưới dạng buffer
  return canvas.toBuffer('image/png');
}

app.get('/captcha', (req, res) => {
  const img = generateCaptcha(req);
  res.set('Content-Type', 'image/png');
  res.send(img);
});

app.post('/verify-captcha', (req, res) => {
  const { captcha } = req.body;
  const clientIp = req.ip || 'default';
  const storedCaptcha = captchaStore.get(clientIp);

  if (storedCaptcha && captcha === storedCaptcha) {
    captchaStore.delete(clientIp); // Xóa sau khi xác minh
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Mã xác nhận không đúng' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Captcha API running on port ${port}`));