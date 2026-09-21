import { readFileSync, writeFileSync } from 'node:fs';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const writeJson = (path, data) => writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

const grade8Path = 'src/data/geography_8.json';
const grade9Path = 'src/data/geography_9.json';

const grade8McqKeys = {
  g8_l2: 'CB DABCABACADB AD'.replaceAll(' ', ''),
  g8_l3: 'DABB CABA CBBBABA'.replaceAll(' ', ''),
  g8_l4: 'ACBBCDBBCD BCDBC'.replaceAll(' ', ''),
  g8_l5: 'CCCBABBB C BBDCAB'.replaceAll(' ', ''),
  g8_l6: 'BCCCABDD BBAABAC'.replaceAll(' ', ''),
  g8_l7: 'ABCDBCDACDABDAB',
  g8_l8: 'BCD ACDABDABCABD'.replaceAll(' ', ''),
  g8_l9: 'CDABDABCAB CDBCA'.replaceAll(' ', ''),
  g8_l10: 'DABCAB CDBC DACDB'.replaceAll(' ', ''),
  g8_l11: 'ACBCABCB CBBABCC'.replaceAll(' ', ''),
  g8_l12: 'BCABACBBCBBAAAB',
  g8_l13: 'CBAABBCBAAAABBA',
  g8_l14: 'BBABCCCBAABACAB',
  g8_l15: 'AAAAAAAAAAAAAAA',
};

const grade9McqKeys = {
  g9_l1: 'CCABCD BABB'.replaceAll(' ', ''),
  g9_l2: 'BAABBBACCB',
  g9_l3: 'CBBBABB AAC'.replaceAll(' ', ''),
  g9_l4: 'BAAAAAAABA',
  g9_l5: 'BABC AAC AAB'.replaceAll(' ', ''),
  g9_l6: 'BCBBBCADAA',
  g9_l7: 'AAAAAAAAAA',
  g9_l8: 'AAABB AAAAA'.replaceAll(' ', ''),
  g9_l9: 'AAAAAAAAAA',
  g9_l10: 'BAAABAAAAA',
  g9_l11: 'AAAAAAAAAA',
  g9_l12: 'AAAAAAAAAA',
  g9_l13: 'AAAAAAAAAA',
  g9_l14: 'AAAAAAAAAA',
  g9_l15: 'AAAAAAAAAA',
  g9_l16: 'AAAAAAAAAA',
  g9_l17: 'AAAAAAAAAA',
  g9_l18: 'AAAAAAAAAA',
  g9_l19: 'AAAAAAAAAA',
  g9_l21: 'ABDCABCB CB'.replaceAll(' ', ''),
  g9_l22: 'AAABAAAAAC',
};

const grade8TfKeys = {
  g8_l3: ['ĐSĐĐ', 'ĐĐSĐ', 'ĐSĐĐ', 'ĐSĐĐ', 'ĐSĐĐ'],
  g8_l4: ['ĐSĐĐ', 'ĐSĐĐ', 'ĐSĐĐ', 'ĐSĐĐ', 'ĐSĐĐ'],
  g8_l5: ['ĐSĐĐ', 'ĐSĐĐ', 'ĐSĐĐ', 'ĐSĐĐ', 'ĐSĐĐ'],
  g8_l6: ['ĐSĐĐ', 'ĐSĐĐ', 'ĐSĐĐ', 'ĐSĐĐ', 'ĐSĐĐ'],
  g8_l7: ['ĐSĐĐ', 'ĐĐSĐ', 'ĐĐSĐ', 'ĐĐSĐ', 'ĐĐSĐ'],
  g8_l8: ['ĐSĐĐ', 'ĐSSĐ', 'ĐĐSĐ', 'ĐSĐĐ', 'ĐSĐĐ'],
  g8_l9: ['ĐSĐĐ', 'ĐĐSĐ', 'ĐĐSĐ', 'ĐSĐĐ', 'ĐĐSĐ'],
  g8_l10: ['ĐSĐĐ', 'ĐSĐĐ', 'ĐSĐĐ', 'ĐSĐĐ', 'ĐĐSĐ'],
  g8_l11: ['ĐSĐĐ', 'ĐSĐĐ', 'ĐSĐĐ', 'ĐSĐĐ', 'ĐĐSĐ'],
  g8_l12: ['ĐSĐĐ', 'ĐĐSĐ', 'ĐSĐĐ', 'ĐĐSĐ', 'ĐSĐĐ'],
  g8_l13: ['SĐĐĐ', 'ĐSĐĐ', 'ĐSĐĐ', 'ĐSĐĐ', 'SĐĐĐ'],
  g8_l14: ['ĐSĐĐ', 'ĐSĐĐ', 'ĐĐSĐ', 'ĐSĐĐ', 'ĐĐSĐ'],
  g8_l15: ['ĐSĐĐ', 'ĐĐSĐ', 'ĐSĐĐ', 'ĐSĐĐ', 'ĐSĐĐ'],
};

const grade9TfKeys = {
  g9_l5: ['ĐĐSĐ', 'ĐSĐĐ', 'ĐĐSĐ', 'ĐĐĐS', 'ĐĐSĐ'],
  g9_l6: ['ĐĐSĐ', 'ĐĐSĐ', 'ĐĐSĐ', 'ĐĐSĐ', 'ĐĐSĐ'],
  g9_l7: ['ĐSĐS', 'ĐĐSĐ', 'ĐSĐS', 'ĐSĐS', 'ĐĐSĐ'],
  g9_l8: ['ĐĐSĐ', 'ĐĐSĐ', 'ĐĐĐS', 'ĐĐĐS', 'ĐĐĐS'],
};

const answerText = (question) => {
  const option = question.options['ABCD'.indexOf(question.answer)] ?? '';
  return option.replace(/^[A-D][.:]\s*/, '').replace(/\.$/, '');
};

const applyMcqKeys = (lessons, keyMap) => {
  for (const lesson of lessons) {
    const keys = keyMap[lesson.id];
    if (!keys) continue;
    if (keys.length !== lesson.mcq_questions.length) {
      throw new Error(`${lesson.id}: expected ${lesson.mcq_questions.length} MCQ keys, received ${keys.length}`);
    }
    lesson.mcq_questions.forEach((question, index) => {
      question.answer = keys[index];
      question.explanation = `Đáp án ${question.answer}: ${answerText(question)}. Đây là phương án phù hợp với kiến thức và dữ kiện của câu hỏi.`;
      delete question.context;
      delete question.imageUrl;
    });
  }
};

const applyTfKeys = (lessons, keyMap) => {
  for (const lesson of lessons) {
    const keys = keyMap[lesson.id];
    if (!keys) continue;
    if (keys.length !== lesson.tf_questions.length) {
      throw new Error(`${lesson.id}: expected ${lesson.tf_questions.length} TF keys, received ${keys.length}`);
    }
    lesson.tf_questions.forEach((question, questionIndex) => {
      const answers = keys[questionIndex];
      question.statements.forEach((statement, statementIndex) => {
        statement.answer = answers[statementIndex];
      });
      question.explanation = `Kết luận: ${question.statements.map((statement) => `${statement.key}) ${statement.answer === 'Đ' ? 'Đúng' : 'Sai'}`).join('; ')}. Các kết luận được đối chiếu trực tiếp với ngữ liệu của câu hỏi.`;
      delete question.imageUrl;
    });
  }
};

const looksLikeAnswerOnly = (text) => {
  const value = text.trim();
  return /^(?:[\d.,]+(?:\s*[/:×x+-]\s*[\d.,]+)+|[\d.,]+\s*(?:%|°C|°|km|m|mm|ha|lần|loài|phụ lưu|kg\/m³|tấn|m³\/s|triệu|tỉ|nghìn)|ha\.|tấn\.|m³\.|≈)/i.test(value);
};

const cleanAnswer = (value) => value.trim().replace(/\.$/, '');

const reconstructGrade8ShortAnswers = (lessons) => {
  for (const lesson of lessons) {
    const answerOnly = new Map();
    for (const question of lesson.sa_questions) {
      if (looksLikeAnswerOnly(question.question)) answerOnly.set(question.num, cleanAnswer(question.question));
    }

    const retained = lesson.sa_questions.filter((question) => !looksLikeAnswerOnly(question.question));
    const byNumber = new Map(retained.map((question) => [question.num, question]));
    const additions = [];

    for (const question of retained) {
      if (answerOnly.has(question.num)) {
        question.answer = answerOnly.get(question.num);
        question.explanation = `Kết quả đúng là ${question.answer}. Các dữ kiện cần thiết được nêu trực tiếp trong câu hỏi.`;
      }

      const embedded = question.instruction?.match(/^Câu\s+(\d+)[.:]\s*(.+?)(?:\s*\[[^\]]+\])?$/i);
      if (embedded) {
        const number = Number(embedded[1]);
        if (!byNumber.has(number) && answerOnly.has(number)) {
          additions.push({
            id: `${lesson.id}_sa_${number}`,
            num: number,
            type: 'short_answer',
            question: embedded[2].trim(),
            instruction: 'Nhập kết quả bằng số; có thể dùng dấu phẩy hoặc dấu chấm thập phân.',
            difficulty: question.difficulty,
            answer: answerOnly.get(number),
            explanation: `Kết quả đúng là ${answerOnly.get(number)}. Các dữ kiện cần thiết được nêu trực tiếp trong câu hỏi.`,
          });
        }
      }
      question.instruction = 'Nhập kết quả bằng số; có thể dùng dấu phẩy hoặc dấu chấm thập phân.';
      delete question.imageUrl;
    }

    lesson.sa_questions = [...retained, ...additions].sort((a, b) => a.num - b.num);
  }
};

const cleanGrade9ShortAnswers = (lessons) => {
  for (const lesson of lessons) {
    lesson.sa_questions = lesson.sa_questions.filter((question) => !looksLikeAnswerOnly(question.question));
    for (const question of lesson.sa_questions) {
      question.instruction = 'Nhập kết quả bằng số; có thể dùng dấu phẩy hoặc dấu chấm thập phân.';
      delete question.imageUrl;
    }
  }
};

const updateQuestion = (lessons, id, fields) => {
  for (const lesson of lessons) {
    const question = lesson.sa_questions.find((item) => item.id === id);
    if (question) {
      Object.assign(question, fields);
      return;
    }
  }
  throw new Error(`Short-answer question not found: ${id}`);
};

const enrichSparseShortAnswers = (lessons) => {
  for (const lesson of lessons) {
    for (const question of lesson.sa_questions) {
      const questionNumbers = question.question.match(/\d+(?:[.,]\d+)?/g) ?? [];
      const formula = question.explanation
        .replace(/^.*?:\s*/, '')
        .split(/=|≈/)[0]
        .trim();
      const formulaNumbers = formula.match(/\d+(?:[.,]\d+)?/g) ?? [];
      if (questionNumbers.length < 2 && formulaNumbers.length >= 2 && !question.question.startsWith('Cho các số liệu')) {
        question.question = `Cho các số liệu: ${formula}. ${question.question.replace(/^Dựa vào\s+(?:Bảng|Hình|bảng|hình)[^,]*,\s*/, '')}`;
      }
    }
  }
};

const normalizeIds = (lessons) => {
  lessons.forEach((lesson, lessonIndex) => {
    lesson.id = `g${lesson.grade}_l${lessonIndex + 1}`;
    lesson.mcq_questions.forEach((question, index) => {
      question.id = `${lesson.id}_mcq_${index + 1}`;
      question.num = index + 1;
    });
    lesson.tf_questions.forEach((question, index) => {
      question.id = `${lesson.id}_tf_${index + 1}`;
      question.num = index + 1;
    });
    lesson.sa_questions.forEach((question, index) => {
      question.id = `${lesson.id}_sa_${index + 1}`;
      question.num = index + 1;
    });
  });
};

let grade8 = readJson(grade8Path);
let grade9 = readJson(grade9Path);

if (grade8.some((lesson) => lesson.title.startsWith('CHỦ ĐỀ 1. VĂN MINH CHÂU THỔ'))) {
  console.log('Question banks are already normalized; no changes were made.');
  process.exit(0);
}

grade8 = grade8.filter((lesson) => (
  lesson.mcq_questions.length + lesson.tf_questions.length + lesson.sa_questions.length > 0
));
grade9 = grade9.filter((lesson) => (
  lesson.mcq_questions.length + lesson.tf_questions.length + lesson.sa_questions.length > 0
));

// The source parser merged three independent Grade 8 units into one lesson.
const mergedIndex = grade8.findIndex((lesson) => lesson.id === 'g8_l13');
const merged = grade8[mergedIndex];
const splitLessons = [
  {
    ...merged,
    id: 'g8_l13',
    title: 'BÀI 12. MÔI TRƯỜNG VÀ TÀI NGUYÊN BIỂN ĐẢO VIỆT NAM',
    mcq_questions: merged.mcq_questions.slice(0, 15),
    tf_questions: merged.tf_questions.slice(0, 5),
    sa_questions: merged.sa_questions.slice(0, 5),
  },
  {
    ...merged,
    id: 'g8_l14',
    title: 'CHỦ ĐỀ 1. VĂN MINH CHÂU THỔ SÔNG HỒNG VÀ SÔNG CỬU LONG',
    mcq_questions: merged.mcq_questions.slice(15, 30),
    tf_questions: merged.tf_questions.slice(5, 10),
    sa_questions: merged.sa_questions.slice(5, 10),
  },
  {
    ...merged,
    id: 'g8_l15',
    title: 'CHỦ ĐỀ 2. BẢO VỆ CHỦ QUYỀN, CÁC QUYỀN VÀ LỢI ÍCH HỢP PHÁP CỦA VIỆT NAM Ở BIỂN ĐÔNG',
    mcq_questions: merged.mcq_questions.slice(30, 45),
    tf_questions: merged.tf_questions.slice(10, 15),
    sa_questions: [],
  },
];
grade8.splice(mergedIndex, 1, ...splitLessons);

// Replace the malformed placeholder MCQ with a complete, plausible option set.
const agriculture = grade9.find((lesson) => lesson.id === 'g9_l5');
const marketQuestion = agriculture.mcq_questions[8];
marketQuestion.options = [
  'A. Thị trường tiêu thụ ngày càng mở rộng.',
  'B. Địa hình đồi núi chiếm phần lớn diện tích.',
  'C. Khí hậu phân hóa theo độ cao.',
  'D. Sông ngòi có nhiều nước theo mùa.',
];

applyMcqKeys(grade8, grade8McqKeys);
applyMcqKeys(grade9, grade9McqKeys);
applyTfKeys(grade8, grade8TfKeys);
applyTfKeys(grade9, grade9TfKeys);
reconstructGrade8ShortAnswers(grade8);
cleanGrade9ShortAnswers(grade9);

// Grade 8 short answers backed by the answer tables in the source document.
const grade8Lesson1Answers = {
  g8_l2_sa_21: ['14°49′', '23°23′ - 8°34′ = 14°49′.'],
  g8_l2_sa_22: ['3.0', '1 000 000 / 331 300 ≈ 3,0 lần.'],
  g8_l2_sa_23: ['7.3', '24 233,1 / 331 300 × 100 ≈ 7,3%.'],
  g8_l2_sa_24: ['70.9', '3 260 / 4 600 × 100 ≈ 70,9%.'],
  g8_l2_sa_25: ['11.0', '36 494,6 / 331 344 × 100 ≈ 11,0%.'],
};
for (const [id, [answer, explanation]] of Object.entries(grade8Lesson1Answers)) {
  updateQuestion(grade8, id, { answer, explanation });
}
updateQuestion(grade8, 'g8_l2_sa_25', {
  question: 'Tổng diện tích của 6 thành phố trong bảng là 36 494,6 km²; diện tích cả nước là 331 344 km². Tổng diện tích 6 thành phố chiếm bao nhiêu % diện tích cả nước?',
});

const explicitGrade8 = {
  g8_l7_sa_22: ['Sông Thu Bồn có mùa lũ chiếm 65% và mùa cạn chiếm 35% lượng nước năm. Chênh lệch giữa hai mùa là bao nhiêu điểm phần trăm?', '30', '65% - 35% = 30 điểm phần trăm.'],
  g8_l7_sa_24: ['Chiều dài dòng chính sông Hồng trên lãnh thổ Việt Nam là bao nhiêu ki-lô-mét?', '556', 'Theo số liệu bài học, dòng chính sông Hồng trên lãnh thổ Việt Nam dài 556 km.'],
  g8_l9_sa_22: ['Nhiệt độ trung bình năm tại Tân Sơn Hòa tăng từ 27,3°C lên 28,5°C. Mức tăng là bao nhiêu °C?', '1.2', '28,5 - 27,3 = 1,2°C.'],
  g8_l9_sa_24: ['Lượng mưa năm tại trạm Láng tăng từ 1 465,5 mm lên 1 743,9 mm. Mức tăng là bao nhiêu mm?', '278.4', '1 743,9 - 1 465,5 = 278,4 mm.'],
  g8_l10_sa_21: ['Đất feralit chiếm 65% và đất phù sa chiếm 24% diện tích đất tự nhiên. Chênh lệch tỉ trọng là bao nhiêu điểm phần trăm?', '41', '65% - 24% = 41 điểm phần trăm.'],
  g8_l10_sa_22: ['Đất feralit chiếm 65% và đất phù sa chiếm 24% diện tích đất tự nhiên. Hai nhóm đất chiếm tổng cộng bao nhiêu %?', '89', '65% + 24% = 89%.'],
  g8_l10_sa_23: ['Nếu 10 triệu ha tương ứng 30% diện tích đất tự nhiên, tổng diện tích đất tự nhiên xấp xỉ bao nhiêu triệu ha?', '33.3', '10 / 30 × 100 ≈ 33,3 triệu ha.'],
};
for (const [id, [question, answer, explanation]] of Object.entries(explicitGrade8)) {
  updateQuestion(grade8, id, { question, answer, explanation });
}

// Correct Grade 9 calculations against the tables in the source DOCX and make them self-contained.
const explicitGrade9 = {
  g9_l1_sa_16: ['Dân số Việt Nam tăng từ 76,5 triệu người năm 1999 lên 101,3 triệu người năm 2024. Mức tăng là bao nhiêu triệu người?', '24.8', '101,3 - 76,5 = 24,8 triệu người.'],
  g9_l1_sa_18: ['Dân số Việt Nam là 76,5 triệu người năm 1999 và 101,3 triệu người năm 2024. Tính tốc độ tăng trưởng năm 2024 so với năm 1999, lấy năm 1999 = 100%.', '132.4', '101,3 / 76,5 × 100 ≈ 132,4%.'],
  g9_l1_sa_19: ['Tỉ lệ tăng dân số giảm từ 1,51% năm 1999 xuống 1,03% năm 2024. Mức giảm là bao nhiêu điểm phần trăm?', '0.48', '1,51% - 1,03% = 0,48 điểm phần trăm.'],
  g9_l1_sa_20: ['Tỉ lệ dân số dưới 15 tuổi giảm từ 33,1% năm 1999 xuống 23,3% năm 2024. Mức giảm là bao nhiêu điểm phần trăm?', '9.8', '33,1% - 23,3% = 9,8 điểm phần trăm.'],
  g9_l1_sa_21: ['Tỉ lệ dân số từ 65 tuổi trở lên tăng từ 5,8% năm 1999 lên 9,3% năm 2024. Mức tăng là bao nhiêu điểm phần trăm?', '3.5', '9,3% - 5,8% = 3,5 điểm phần trăm.'],
  g9_l1_sa_22: ['Năm 2024, nhóm dưới 15 tuổi chiếm 23,3% và nhóm từ 65 tuổi trở lên chiếm 9,3%. Hai nhóm dân số phụ thuộc chiếm tổng cộng bao nhiêu %?', '32.6', '23,3% + 9,3% = 32,6%.'],
  g9_l1_sa_24: ['Tỉ số giới tính tăng từ 98,0 lên 99,7 nam/100 nữ. Mức tăng là bao nhiêu nam/100 nữ?', '1.7', '99,7 - 98,0 = 1,7 nam/100 nữ.'],
  g9_l2_sa_16: ['Năm 2024, mật độ dân số Đồng bằng sông Hồng là 1 034 người/km² và Trung du và miền núi phía Bắc là 136 người/km². Chênh lệch là bao nhiêu người/km²?', '898', '1 034 - 136 = 898 người/km².'],
  g9_l2_sa_18: ['Tỉ lệ dân thành thị tăng từ 19,5% năm 1990 lên 38,5% năm 2024. Mức tăng là bao nhiêu điểm phần trăm?', '19.0', '38,5% - 19,5% = 19,0 điểm phần trăm.'],
  g9_l2_sa_22: ['Năm 2024, dân nông thôn chiếm 61,5% và dân thành thị chiếm 38,5%. Tỉ lệ dân nông thôn gấp khoảng bao nhiêu lần dân thành thị?', '1.6', '61,5 / 38,5 ≈ 1,6 lần.'],
  g9_l2_sa_24: ['Năm 2024, mật độ dân số Trung du và miền núi phía Bắc là 136 người/km², cả nước là 306 người/km². Mật độ của vùng bằng bao nhiêu % mức cả nước?', '44.4', '136 / 306 × 100 ≈ 44,4%.'],
  g9_l2_sa_25: ['Năm 2024, mật độ dân số cả nước là 306 người/km², Trung du và miền núi phía Bắc là 136 người/km². Chênh lệch là bao nhiêu người/km²?', '170', '306 - 136 = 170 người/km².'],
  g9_l3_sa_16: ['Lực lượng lao động tăng từ 50,4 triệu người năm 2010 lên 52,9 triệu người năm 2024. Mức tăng là bao nhiêu triệu người?', '2.5', '52,9 - 50,4 = 2,5 triệu người.'],
  g9_l3_sa_17: ['Lực lượng lao động giảm từ 54,8 triệu người năm 2020 xuống 50,6 triệu người năm 2021. Mức giảm là bao nhiêu triệu người?', '4.2', '54,8 - 50,6 = 4,2 triệu người.'],
  g9_l3_sa_18: ['Lực lượng lao động tăng từ 50,6 triệu người năm 2021 lên 52,9 triệu người năm 2024. Mức tăng là bao nhiêu triệu người?', '2.3', '52,9 - 50,6 = 2,3 triệu người.'],
  g9_l3_sa_19: ['Tỉ trọng lao động nông, lâm nghiệp và thủy sản giảm từ 49,5% năm 2010 xuống 26,4% năm 2024. Mức giảm là bao nhiêu điểm phần trăm?', '23.1', '49,5% - 26,4% = 23,1 điểm phần trăm.'],
  g9_l3_sa_20: ['Tỉ trọng lao động công nghiệp và xây dựng tăng từ 20,9% năm 2010 lên 33,4% năm 2024. Mức tăng là bao nhiêu điểm phần trăm?', '12.5', '33,4% - 20,9% = 12,5 điểm phần trăm.'],
  g9_l3_sa_21: ['Tỉ trọng lao động dịch vụ tăng từ 29,6% năm 2010 lên 40,2% năm 2024. Mức tăng là bao nhiêu điểm phần trăm?', '10.6', '40,2% - 29,6% = 10,6 điểm phần trăm.'],
  g9_l3_sa_22: ['Năm 2024, lao động dịch vụ chiếm 40,2%, còn nông, lâm nghiệp và thủy sản chiếm 26,4%. Chênh lệch là bao nhiêu điểm phần trăm?', '13.8', '40,2% - 26,4% = 13,8 điểm phần trăm.'],
  g9_l3_sa_23: ['Tỉ trọng lao động khu vực có vốn đầu tư nước ngoài tăng từ 3,5% năm 2010 lên 10,4% năm 2024. Mức tăng là bao nhiêu điểm phần trăm?', '6.9', '10,4% - 3,5% = 6,9 điểm phần trăm.'],
  g9_l3_sa_25: ['Tỉ lệ thiếu việc làm giảm từ 3,57% năm 2010 xuống 1,85% năm 2024. Mức giảm là bao nhiêu điểm phần trăm?', '1.7', '3,57% - 1,85% = 1,72 ≈ 1,7 điểm phần trăm.'],
  g9_l4_sa_16: ['Thu nhập bình quân của Trung du và miền núi phía Bắc tăng từ 907 nghìn đồng năm 2010 lên 3 749 nghìn đồng năm 2024. Mức tăng là bao nhiêu nghìn đồng?', '2842', '3 749 - 907 = 2 842 nghìn đồng.'],
  g9_l4_sa_17: ['Thu nhập bình quân của Đồng bằng sông Hồng tăng từ 1 561 nghìn đồng năm 2010 lên 6 480 nghìn đồng năm 2024. Mức tăng là bao nhiêu nghìn đồng?', '4919', '6 480 - 1 561 = 4 919 nghìn đồng.'],
  g9_l4_sa_19: ['Thu nhập bình quân của Đông Nam Bộ tăng từ 2 212 nghìn đồng năm 2010 lên 6 868 nghìn đồng năm 2024. Tính tốc độ tăng trưởng, lấy năm 2010 = 100%.', '310.5', '6 868 / 2 212 × 100 ≈ 310,5%.'],
  g9_l4_sa_20: ['Năm 2010, thu nhập cao nhất là 2 212 nghìn đồng và thấp nhất là 903 nghìn đồng. Chênh lệch là bao nhiêu nghìn đồng?', '1309', '2 212 - 903 = 1 309 nghìn đồng.'],
  g9_l4_sa_21: ['Năm 2024, thu nhập cao nhất là 6 868 nghìn đồng và thấp nhất là 3 749 nghìn đồng. Chênh lệch là bao nhiêu nghìn đồng?', '3119', '6 868 - 3 749 = 3 119 nghìn đồng.'],
  g9_l4_sa_22: ['Chênh lệch thu nhập cao nhất - thấp nhất là 1 309 nghìn đồng năm 2010 và 3 119 nghìn đồng năm 2024. Mức chênh lệch tăng thêm bao nhiêu nghìn đồng?', '1810', '3 119 - 1 309 = 1 810 nghìn đồng.'],
  g9_l4_sa_24: ['Tổng thu nhập bình quân của 6 vùng năm 2010 là 7 953 nghìn đồng/người/tháng. Trung bình của 6 vùng là bao nhiêu nghìn đồng/người/tháng?', '1325.5', '7 953 / 6 = 1 325,5 nghìn đồng/người/tháng.'],
};
for (const [id, [question, answer, explanation]] of Object.entries(explicitGrade9)) {
  updateQuestion(grade9, id, { question, answer, explanation });
}

enrichSparseShortAnswers(grade8);
enrichSparseShortAnswers(grade9);

// Clarify one context whose comparison was previously implicit.
const seaClimate = grade8.find((lesson) => lesson.id === 'g8_l12')?.tf_questions[3];
if (seaClimate) seaClimate.context = seaClimate.context.replace('trên 1 100 mm/năm;', 'trên 1 100 mm/năm và thấp hơn trên đất liền;');

normalizeIds(grade8);
normalizeIds(grade9);
writeJson(grade8Path, grade8);
writeJson(grade9Path, grade9);

console.log(`Normalized ${grade8.reduce((sum, lesson) => sum + lesson.mcq_questions.length + lesson.tf_questions.length + lesson.sa_questions.length, 0)} Grade 8 questions.`);
console.log(`Normalized ${grade9.reduce((sum, lesson) => sum + lesson.mcq_questions.length + lesson.tf_questions.length + lesson.sa_questions.length, 0)} Grade 9 questions.`);
