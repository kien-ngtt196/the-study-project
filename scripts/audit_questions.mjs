import { readFileSync } from 'node:fs';

const files = ['src/data/geography_8.json', 'src/data/geography_9.json'];
const allowedDifficulties = new Set(['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao']);
const errors = [];
const allIds = new Set();
const allQuestionTexts = new Map();
let total = 0;

const fail = (file, id, message) => errors.push(`${file} :: ${id} :: ${message}`);
const normalizedOption = (option) => option.replace(/^[A-D][.:]\s*/, '').trim().toLocaleLowerCase('vi');

for (const file of files) {
  const lessons = JSON.parse(readFileSync(file, 'utf8'));

  for (const lesson of lessons) {
    const questions = [
      ...lesson.mcq_questions,
      ...lesson.tf_questions,
      ...lesson.sa_questions,
    ];

    if (questions.length === 0) fail(file, lesson.id, 'Bài học không có câu hỏi.');

    for (const question of questions) {
      total += 1;
      if (allIds.has(question.id)) fail(file, question.id, 'ID bị trùng.');
      allIds.add(question.id);

      if (!allowedDifficulties.has(question.difficulty)) {
        fail(file, question.id, `Mức độ không hợp lệ: ${question.difficulty}`);
      }
      if (!question.explanation?.trim()) fail(file, question.id, 'Thiếu lời giải.');
      if (/Đáp án khác|Phương án khác|Tính chỉ số bài học|Câu\s+\d+[.:]/i.test(JSON.stringify(question))) {
        fail(file, question.id, 'Còn nội dung placeholder hoặc câu bị ghép.');
      }

      const visibleText = question.type === 'true_false' ? question.context : question.question;
      if (!visibleText?.trim() || visibleText.trim().length < 12) {
        fail(file, question.id, 'Câu dẫn/ngữ cảnh quá ngắn hoặc bị thiếu.');
      }
      const textKey = `${lesson.grade}:${question.type}:${visibleText.trim().toLocaleLowerCase('vi')}`;
      if (allQuestionTexts.has(textKey)) {
        fail(file, question.id, `Trùng nội dung với ${allQuestionTexts.get(textKey)}.`);
      }
      allQuestionTexts.set(textKey, question.id);

      if (question.type === 'mcq') {
        if (question.options.length !== 4) fail(file, question.id, 'MCQ không có đúng 4 lựa chọn.');
        const uniqueOptions = new Set(question.options.map(normalizedOption));
        if (uniqueOptions.size !== 4) fail(file, question.id, 'MCQ có lựa chọn trùng nhau.');
        question.options.forEach((option, index) => {
          const expected = String.fromCharCode(65 + index);
          if (!option.startsWith(`${expected}.`)) fail(file, question.id, `Lựa chọn ${expected} thiếu nhãn chuẩn.`);
        });
        if (!['A', 'B', 'C', 'D'].includes(question.answer)) fail(file, question.id, 'Đáp án MCQ không hợp lệ.');
        if (!question.explanation.includes(`Đáp án ${question.answer}`)) {
          fail(file, question.id, 'Lời giải MCQ không nêu rõ đáp án đúng.');
        }
      } else if (question.type === 'true_false') {
        if (question.statements.length !== 4) fail(file, question.id, 'Câu Đúng/Sai không có đúng 4 ý.');
        question.statements.forEach((statement, index) => {
          const expected = String.fromCharCode(97 + index);
          if (statement.key !== expected) fail(file, question.id, `Khóa ý ${statement.key} không đúng thứ tự.`);
          if (!['Đ', 'S'].includes(statement.answer)) fail(file, question.id, `Đáp án ý ${statement.key} không hợp lệ.`);
          if (!statement.statement?.trim()) fail(file, question.id, `Ý ${statement.key} bị trống.`);
        });
      } else if (question.type === 'short_answer') {
        if (!question.answer?.trim()) fail(file, question.id, 'Câu trả lời ngắn thiếu đáp án.');
        if (/^\s*\d[\d\s.,]*(?:%|°C|km|mm|m|ha|lần|tấn)?\.?\s*$/.test(question.question)) {
          fail(file, question.id, 'Câu dẫn chỉ chứa một kết quả, không phải câu hỏi.');
        }
        if (/Dựa vào\s+(?:bảng|hình|biểu đồ)/i.test(question.question)) {
          fail(file, question.id, 'Câu hỏi còn phụ thuộc bảng/hình không được hiển thị.');
        }
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`Question-bank audit failed with ${errors.length} issue(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Question-bank audit passed: ${total} questions, ${allIds.size} unique IDs.`);
